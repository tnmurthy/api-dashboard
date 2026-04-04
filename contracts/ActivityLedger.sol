// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ActivityLedger
 * @notice Append-only log of CRM interaction hashes.
 *         Every call, email, meeting, or API usage event is signed and recorded here.
 *         Full payloads are stored off-chain; only keccak256 hashes land on-chain,
 *         giving an unforgeable, ordered, and timestamped activity audit trail.
 *
 *         No updates or deletes – immutability is the entire point.
 *         Any wallet authorized under the org can append entries.
 */
contract ActivityLedger {

    // ─── Enums / Structs ─────────────────────────────────────────────────────────

    /// Activity type tags for easy on-chain filtering via The Graph
    enum ActivityType {
        Call,       // 0
        Email,      // 1
        Meeting,    // 2
        Note,       // 3
        ApiUsage,   // 4
        DealUpdate, // 5
        Custom      // 6
    }

    struct Entry {
        uint256       index;       // global sequence number
        bytes32       orgId;
        bytes32       contactId;   // optional – zero if not contact-specific
        bytes32       dealId;      // optional – zero if not deal-specific
        bytes32       payloadHash; // keccak256 of the full off-chain payload JSON
        ActivityType  activityType;
        address       actor;
        uint256       timestamp;
    }

    // ─── State ───────────────────────────────────────────────────────────────────

    interface ICRMRegistry {
        function isMember(bytes32 orgId, address wallet) external view returns (bool);
    }

    ICRMRegistry public immutable registry;

    /// Global append-only log
    Entry[] private _log;

    /// orgId → list of global indices into _log
    mapping(bytes32 => uint256[]) private _orgIndices;

    /// contactId → list of global indices
    mapping(bytes32 => uint256[]) private _contactIndices;

    /// dealId → list of global indices
    mapping(bytes32 => uint256[]) private _dealIndices;

    // ─── Events ──────────────────────────────────────────────────────────────────

    event ActivityLogged(
        uint256   indexed index,
        bytes32   indexed orgId,
        bytes32   indexed contactId,
        bytes32           dealId,
        bytes32           payloadHash,
        ActivityType      activityType,
        address           actor,
        uint256           timestamp
    );

    // ─── Modifier ────────────────────────────────────────────────────────────────

    modifier onlyMember(bytes32 orgId) {
        require(registry.isMember(orgId, msg.sender), "ActivityLedger: not an org member");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────────

    constructor(address registryAddress) {
        require(registryAddress != address(0), "ActivityLedger: zero registry address");
        registry = ICRMRegistry(registryAddress);
    }

    // ─── External Functions ──────────────────────────────────────────────────────

    /**
     * @notice Append a new activity entry.
     * @param orgId        Organization that owns this activity
     * @param contactId    Associated contact (bytes32(0) if none)
     * @param dealId       Associated deal    (bytes32(0) if none)
     * @param payloadHash  keccak256 of the full off-chain activity JSON
     * @param activityType Enum tag for filtering
     * @return index       The global sequence number assigned to this entry
     */
    function log(
        bytes32      orgId,
        bytes32      contactId,
        bytes32      dealId,
        bytes32      payloadHash,
        ActivityType activityType
    )
        external
        onlyMember(orgId)
        returns (uint256 index)
    {
        require(payloadHash != bytes32(0), "ActivityLedger: empty payload hash");

        index = _log.length;

        _log.push(Entry({
            index:        index,
            orgId:        orgId,
            contactId:    contactId,
            dealId:       dealId,
            payloadHash:  payloadHash,
            activityType: activityType,
            actor:        msg.sender,
            timestamp:    block.timestamp
        }));

        _orgIndices[orgId].push(index);

        if (contactId != bytes32(0)) {
            _contactIndices[contactId].push(index);
        }
        if (dealId != bytes32(0)) {
            _dealIndices[dealId].push(index);
        }

        emit ActivityLogged(index, orgId, contactId, dealId, payloadHash, activityType, msg.sender, block.timestamp);
    }

    /**
     * @notice Batch-append multiple activity entries in one transaction to save gas.
     */
    function logBatch(
        bytes32[]      calldata orgIds,
        bytes32[]      calldata contactIds,
        bytes32[]      calldata dealIds,
        bytes32[]      calldata payloadHashes,
        ActivityType[] calldata activityTypes
    ) external {
        uint256 len = orgIds.length;
        require(
            len == contactIds.length &&
            len == dealIds.length &&
            len == payloadHashes.length &&
            len == activityTypes.length,
            "ActivityLedger: array length mismatch"
        );
        require(len <= 50, "ActivityLedger: max 50 entries per batch");

        for (uint256 i = 0; i < len; i++) {
            require(registry.isMember(orgIds[i], msg.sender), "ActivityLedger: not a member");
            require(payloadHashes[i] != bytes32(0), "ActivityLedger: empty hash");

            uint256 index = _log.length;

            _log.push(Entry({
                index:        index,
                orgId:        orgIds[i],
                contactId:    contactIds[i],
                dealId:       dealIds[i],
                payloadHash:  payloadHashes[i],
                activityType: activityTypes[i],
                actor:        msg.sender,
                timestamp:    block.timestamp
            }));

            _orgIndices[orgIds[i]].push(index);
            if (contactIds[i] != bytes32(0)) _contactIndices[contactIds[i]].push(index);
            if (dealIds[i]    != bytes32(0)) _dealIndices[dealIds[i]].push(index);

            emit ActivityLogged(
                index, orgIds[i], contactIds[i], dealIds[i],
                payloadHashes[i], activityTypes[i], msg.sender, block.timestamp
            );
        }
    }

    // ─── View Functions ───────────────────────────────────────────────────────────

    function getEntry(uint256 index) external view returns (Entry memory) {
        require(index < _log.length, "ActivityLedger: index out of bounds");
        return _log[index];
    }

    function getOrgIndices(bytes32 orgId) external view returns (uint256[] memory) {
        return _orgIndices[orgId];
    }

    function getContactIndices(bytes32 contactId) external view returns (uint256[] memory) {
        return _contactIndices[contactId];
    }

    function getDealIndices(bytes32 dealId) external view returns (uint256[] memory) {
        return _dealIndices[dealId];
    }

    function totalEntries() external view returns (uint256) {
        return _log.length;
    }

    /**
     * @notice Paginated fetch of org activity entries (newest first).
     * @param orgId   The organization
     * @param offset  Start index in the org's index array (0 = latest)
     * @param limit   Max entries to return
     */
    function getOrgActivity(bytes32 orgId, uint256 offset, uint256 limit)
        external
        view
        returns (Entry[] memory entries)
    {
        uint256[] storage indices = _orgIndices[orgId];
        uint256 total = indices.length;
        if (offset >= total) return new Entry[](0);

        uint256 end = total - offset;
        uint256 start = end > limit ? end - limit : 0;
        uint256 count = end - start;

        entries = new Entry[](count);
        for (uint256 i = 0; i < count; i++) {
            // Newest-first: reverse order
            entries[i] = _log[indices[end - 1 - i]];
        }
    }
}
