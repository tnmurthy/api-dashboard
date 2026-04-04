// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title CRMRegistry
 * @notice Registers organizations and maps them to owner wallets.
 *         Acts as the root registry for the entire CRM ecosystem.
 *         All other contracts look up org membership here.
 */
contract CRMRegistry is Ownable, Pausable {

    // ─── Structs ────────────────────────────────────────────────────────────────

    struct Organization {
        bytes32 id;
        address owner;
        string  name;          // stored off-chain hash recommended for privacy
        uint256 createdAt;
        bool    active;
    }

    // ─── State ───────────────────────────────────────────────────────────────────

    /// orgId → Organization
    mapping(bytes32 => Organization)  private _orgs;

    /// wallet → orgId  (one wallet can only own one org)
    mapping(address => bytes32)       private _ownerToOrg;

    /// orgId → member wallet → role (1=admin, 2=sales_rep, 3=read_only)
    mapping(bytes32 => mapping(address => uint8)) private _members;

    /// Ordered list of all org IDs
    bytes32[] private _orgList;

    // ─── Events ──────────────────────────────────────────────────────────────────

    event OrgRegistered(bytes32 indexed orgId, address indexed owner, string name, uint256 timestamp);
    event OrgTransferred(bytes32 indexed orgId, address indexed from, address indexed to);
    event MemberAdded(bytes32 indexed orgId, address indexed member, uint8 role);
    event MemberRemoved(bytes32 indexed orgId, address indexed member);
    event OrgDeactivated(bytes32 indexed orgId);

    // ─── Modifiers ───────────────────────────────────────────────────────────────

    modifier onlyOrgOwner(bytes32 orgId) {
        require(_orgs[orgId].owner == msg.sender, "CRMRegistry: not org owner");
        _;
    }

    modifier orgExists(bytes32 orgId) {
        require(_orgs[orgId].createdAt != 0, "CRMRegistry: org not found");
        _;
    }

    modifier orgActive(bytes32 orgId) {
        require(_orgs[orgId].active, "CRMRegistry: org inactive");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    // ─── External Functions ──────────────────────────────────────────────────────

    /**
     * @notice Register a new organization. Each wallet can own exactly one org.
     * @param name  Human-readable name (or IPFS CID of org metadata)
     * @return orgId  keccak256 hash used as the unique org identifier
     */
    function registerOrg(string calldata name)
        external
        whenNotPaused
        returns (bytes32 orgId)
    {
        require(_ownerToOrg[msg.sender] == bytes32(0), "CRMRegistry: wallet already owns an org");
        require(bytes(name).length > 0, "CRMRegistry: name required");

        orgId = keccak256(abi.encodePacked(msg.sender, block.timestamp, name));

        _orgs[orgId] = Organization({
            id:        orgId,
            owner:     msg.sender,
            name:      name,
            createdAt: block.timestamp,
            active:    true
        });

        _ownerToOrg[msg.sender] = orgId;
        _members[orgId][msg.sender] = 1; // owner gets admin role
        _orgList.push(orgId);

        emit OrgRegistered(orgId, msg.sender, name, block.timestamp);
    }

    /**
     * @notice Add or update a member's role in the organization.
     *         Role 0 effectively removes the member.
     * @param orgId   The target organization
     * @param member  Wallet address of the new member
     * @param role    1 = Admin, 2 = Sales Rep, 3 = Read-only
     */
    function setMember(bytes32 orgId, address member, uint8 role)
        external
        orgExists(orgId)
        orgActive(orgId)
        onlyOrgOwner(orgId)
    {
        require(member != address(0), "CRMRegistry: zero address");
        require(role <= 3, "CRMRegistry: invalid role");
        require(member != msg.sender, "CRMRegistry: cannot change own role");

        if (role == 0) {
            delete _members[orgId][member];
            emit MemberRemoved(orgId, member);
        } else {
            _members[orgId][member] = role;
            emit MemberAdded(orgId, member, role);
        }
    }

    /**
     * @notice Transfer ownership of an organization to a new wallet.
     */
    function transferOrgOwnership(bytes32 orgId, address newOwner)
        external
        orgExists(orgId)
        onlyOrgOwner(orgId)
    {
        require(newOwner != address(0), "CRMRegistry: zero address");
        require(_ownerToOrg[newOwner] == bytes32(0), "CRMRegistry: new owner already has an org");

        delete _ownerToOrg[msg.sender];
        _ownerToOrg[newOwner] = orgId;
        _orgs[orgId].owner = newOwner;
        _members[orgId][newOwner] = 1;

        emit OrgTransferred(orgId, msg.sender, newOwner);
    }

    /**
     * @notice Deactivate an organization (soft delete). Irreversible by design.
     */
    function deactivateOrg(bytes32 orgId)
        external
        orgExists(orgId)
        onlyOrgOwner(orgId)
    {
        _orgs[orgId].active = false;
        emit OrgDeactivated(orgId);
    }

    // ─── View Functions ───────────────────────────────────────────────────────────

    function getOrg(bytes32 orgId) external view returns (Organization memory) {
        return _orgs[orgId];
    }

    function getOrgByOwner(address owner) external view returns (bytes32) {
        return _ownerToOrg[owner];
    }

    function getMemberRole(bytes32 orgId, address member) external view returns (uint8) {
        return _members[orgId][member];
    }

    function isMember(bytes32 orgId, address wallet) external view returns (bool) {
        return _members[orgId][wallet] > 0;
    }

    function totalOrgs() external view returns (uint256) {
        return _orgList.length;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────────

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
