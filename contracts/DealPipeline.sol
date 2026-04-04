// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/Pausable.sol";

interface ICRMRegistry {
    function isMember(bytes32 orgId, address wallet) external view returns (bool);
    function getMemberRole(bytes32 orgId, address member) external view returns (uint8);
}

/**
 * @title DealPipeline
 * @notice On-chain state machine for CRM deals.
 *         Each stage transition is a signed transaction creating an immutable audit trail.
 *         Rich data (notes, attachments) lives off-chain; only hashes + state land here.
 *
 *         Deal stages:
 *           0 = Lead
 *           1 = Qualified
 *           2 = Proposal
 *           3 = Negotiation
 *           4 = ClosedWon
 *           5 = ClosedLost
 */
contract DealPipeline is Pausable {

    // ─── Enums / Structs ─────────────────────────────────────────────────────────

    enum Stage { Lead, Qualified, Proposal, Negotiation, ClosedWon, ClosedLost }

    struct Deal {
        bytes32 id;
        bytes32 orgId;
        bytes32 contactId;      // reference to ContactBook entry
        bytes32 dataHash;       // keccak256 of off-chain deal metadata
        address assignedTo;     // sales rep wallet
        address createdBy;
        uint256 valueWei;       // deal value denominated in wei (use stablecoin peg off-chain)
        uint256 createdAt;
        uint256 updatedAt;
        Stage   stage;
        bool    active;
    }

    struct StageTransition {
        Stage   from;
        Stage   to;
        address actor;
        bytes32 notesHash;      // hash of transition notes stored off-chain
        uint256 timestamp;
    }

    // ─── State ───────────────────────────────────────────────────────────────────

    ICRMRegistry public immutable registry;

    mapping(bytes32 => Deal)                  private _deals;
    mapping(bytes32 => StageTransition[])     private _history;
    mapping(bytes32 => bytes32[])             private _orgDeals;
    mapping(bytes32 => bytes32[])             private _contactDeals;

    // ─── Events ──────────────────────────────────────────────────────────────────

    event DealCreated(
        bytes32 indexed dealId,
        bytes32 indexed orgId,
        bytes32 indexed contactId,
        address assignedTo,
        uint256 valueWei,
        Stage   initialStage,
        uint256 timestamp
    );
    event DealStageAdvanced(
        bytes32 indexed dealId,
        bytes32 indexed orgId,
        Stage   from,
        Stage   to,
        address actor,
        bytes32 notesHash,
        uint256 timestamp
    );
    event DealReassigned(
        bytes32 indexed dealId,
        address indexed from,
        address indexed to,
        uint256 timestamp
    );
    event DealClosed(bytes32 indexed dealId, Stage outcome, uint256 timestamp);

    // ─── Modifiers ───────────────────────────────────────────────────────────────

    modifier onlyMemberOf(bytes32 orgId) {
        require(registry.isMember(orgId, msg.sender), "DealPipeline: not an org member");
        _;
    }

    modifier onlyAdminOrSales(bytes32 orgId) {
        uint8 role = registry.getMemberRole(orgId, msg.sender);
        require(role == 1 || role == 2, "DealPipeline: insufficient role");
        _;
    }

    modifier onlyAdmin(bytes32 orgId) {
        require(registry.getMemberRole(orgId, msg.sender) == 1, "DealPipeline: admin only");
        _;
    }

    modifier dealExists(bytes32 dealId) {
        require(_deals[dealId].createdAt != 0, "DealPipeline: deal not found");
        _;
    }

    modifier dealActive(bytes32 dealId) {
        require(_deals[dealId].active, "DealPipeline: deal closed or inactive");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────────

    constructor(address registryAddress) {
        require(registryAddress != address(0), "DealPipeline: zero registry address");
        registry = ICRMRegistry(registryAddress);
    }

    // ─── External Functions ──────────────────────────────────────────────────────

    /**
     * @notice Create a new deal in the pipeline.
     * @param orgId      Organization that owns the deal
     * @param contactId  ContactBook entry this deal is linked to
     * @param dataHash   keccak256 of off-chain deal metadata (title, description …)
     * @param assignedTo Wallet of the sales rep responsible
     * @param valueWei   Expected deal value in wei (or a scaled integer for USD)
     * @return dealId    The generated unique identifier
     */
    function createDeal(
        bytes32 orgId,
        bytes32 contactId,
        bytes32 dataHash,
        address assignedTo,
        uint256 valueWei
    )
        external
        whenNotPaused
        onlyAdminOrSales(orgId)
        returns (bytes32 dealId)
    {
        require(dataHash   != bytes32(0), "DealPipeline: empty hash");
        require(assignedTo != address(0), "DealPipeline: zero assignee");

        dealId = keccak256(abi.encodePacked(orgId, contactId, dataHash, block.timestamp, msg.sender));

        _deals[dealId] = Deal({
            id:         dealId,
            orgId:      orgId,
            contactId:  contactId,
            dataHash:   dataHash,
            assignedTo: assignedTo,
            createdBy:  msg.sender,
            valueWei:   valueWei,
            createdAt:  block.timestamp,
            updatedAt:  block.timestamp,
            stage:      Stage.Lead,
            active:     true
        });

        _orgDeals[orgId].push(dealId);
        _contactDeals[contactId].push(dealId);

        _history[dealId].push(StageTransition({
            from:      Stage.Lead,
            to:        Stage.Lead,
            actor:     msg.sender,
            notesHash: bytes32(0),
            timestamp: block.timestamp
        }));

        emit DealCreated(dealId, orgId, contactId, assignedTo, valueWei, Stage.Lead, block.timestamp);
    }

    /**
     * @notice Advance a deal to the next stage.
     *         Stages must progress forward (no rollbacks) except from ClosedWon/ClosedLost.
     * @param dealId     The deal to update
     * @param newStage   Target stage
     * @param notesHash  Hash of transition notes (stored off-chain)
     */
    function advanceStage(bytes32 dealId, Stage newStage, bytes32 notesHash)
        external
        whenNotPaused
        dealExists(dealId)
        dealActive(dealId)
    {
        Deal storage d = _deals[dealId];
        uint8 role = registry.getMemberRole(d.orgId, msg.sender);
        require(role == 1 || role == 2, "DealPipeline: insufficient role");

        Stage currentStage = d.stage;
        require(uint8(newStage) > uint8(currentStage), "DealPipeline: must advance stage forward");
        // Closing moves (ClosedWon / ClosedLost) require admin or the assigned rep
        if (newStage == Stage.ClosedWon || newStage == Stage.ClosedLost) {
            require(
                role == 1 || msg.sender == d.assignedTo,
                "DealPipeline: only admin or assigned rep can close"
            );
        }

        d.stage     = newStage;
        d.updatedAt = block.timestamp;

        if (newStage == Stage.ClosedWon || newStage == Stage.ClosedLost) {
            d.active = false;
            emit DealClosed(dealId, newStage, block.timestamp);
        }

        _history[dealId].push(StageTransition({
            from:      currentStage,
            to:        newStage,
            actor:     msg.sender,
            notesHash: notesHash,
            timestamp: block.timestamp
        }));

        emit DealStageAdvanced(dealId, d.orgId, currentStage, newStage, msg.sender, notesHash, block.timestamp);
    }

    /**
     * @notice Reassign a deal to a different sales rep.
     */
    function reassignDeal(bytes32 dealId, address newAssignee)
        external
        dealExists(dealId)
        dealActive(dealId)
    {
        Deal storage d = _deals[dealId];
        require(registry.getMemberRole(d.orgId, msg.sender) == 1, "DealPipeline: admin only");
        require(newAssignee != address(0), "DealPipeline: zero address");

        address old = d.assignedTo;
        d.assignedTo = newAssignee;
        d.updatedAt  = block.timestamp;

        emit DealReassigned(dealId, old, newAssignee, block.timestamp);
    }

    // ─── View Functions ───────────────────────────────────────────────────────────

    function getDeal(bytes32 dealId) external view returns (Deal memory) {
        return _deals[dealId];
    }

    function getDealHistory(bytes32 dealId) external view returns (StageTransition[] memory) {
        return _history[dealId];
    }

    function getOrgDealIds(bytes32 orgId) external view returns (bytes32[] memory) {
        return _orgDeals[orgId];
    }

    function getContactDealIds(bytes32 contactId) external view returns (bytes32[] memory) {
        return _contactDeals[contactId];
    }

    function orgDealCount(bytes32 orgId) external view returns (uint256) {
        return _orgDeals[orgId].length;
    }
}
