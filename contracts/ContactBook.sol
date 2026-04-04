// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/Pausable.sol";

interface ICRMRegistry {
    function isMember(bytes32 orgId, address wallet) external view returns (bool);
    function getMemberRole(bytes32 orgId, address member) external view returns (uint8);
}

/**
 * @title ContactBook
 * @notice Stores immutable identity hashes for CRM contacts.
 *         PII lives off-chain in Supabase; only a keccak256 hash is stored here,
 *         giving an unforgeable, timestamped proof of data existence (GDPR-friendly).
 *
 *         Access rules (roles from CRMRegistry):
 *           1 = Admin     → full CRUD
 *           2 = Sales Rep → create + read
 *           3 = Read-only → read
 */
contract ContactBook is Pausable {

    // ─── Structs ────────────────────────────────────────────────────────────────

    struct Contact {
        bytes32 id;
        bytes32 orgId;
        bytes32 dataHash;      // keccak256 of canonical off-chain JSON
        address registeredBy;
        uint256 createdAt;
        uint256 updatedAt;
        bool    active;
        string  didUri;        // optional DID (e.g. did:ethr:0x…)
    }

    // ─── State ───────────────────────────────────────────────────────────────────

    ICRMRegistry public immutable registry;

    /// contactId → Contact
    mapping(bytes32 => Contact) private _contacts;

    /// orgId → list of contactIds (for enumeration)
    mapping(bytes32 => bytes32[]) private _orgContacts;

    /// dataHash → contactId  (prevents duplicate hashes per org)
    mapping(bytes32 => mapping(bytes32 => bytes32)) private _hashIndex;

    // ─── Events ──────────────────────────────────────────────────────────────────

    event ContactRegistered(
        bytes32 indexed contactId,
        bytes32 indexed orgId,
        bytes32 dataHash,
        address registeredBy,
        uint256 timestamp
    );
    event ContactUpdated(
        bytes32 indexed contactId,
        bytes32 indexed orgId,
        bytes32 oldHash,
        bytes32 newHash,
        uint256 timestamp
    );
    event ContactDeactivated(bytes32 indexed contactId, bytes32 indexed orgId, uint256 timestamp);
    event ConsentGranted(bytes32 indexed contactId, bytes32 indexed orgId, uint256 timestamp);
    event ConsentRevoked(bytes32 indexed contactId, bytes32 indexed orgId, uint256 timestamp);

    // Consent flags stored separately to allow erasure without breaking the contact hash
    mapping(bytes32 => bool) private _consentGranted;

    // ─── Modifiers ───────────────────────────────────────────────────────────────

    modifier onlyMember(bytes32 orgId) {
        require(registry.isMember(orgId, msg.sender), "ContactBook: not an org member");
        _;
    }

    modifier onlyAdminOrSales(bytes32 orgId) {
        uint8 role = registry.getMemberRole(orgId, msg.sender);
        require(role == 1 || role == 2, "ContactBook: insufficient role");
        _;
    }

    modifier onlyAdmin(bytes32 orgId) {
        require(registry.getMemberRole(orgId, msg.sender) == 1, "ContactBook: admin only");
        _;
    }

    modifier contactExists(bytes32 contactId) {
        require(_contacts[contactId].createdAt != 0, "ContactBook: contact not found");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────────

    constructor(address registryAddress) {
        require(registryAddress != address(0), "ContactBook: zero registry address");
        registry = ICRMRegistry(registryAddress);
    }

    // ─── External Functions ──────────────────────────────────────────────────────

    /**
     * @notice Register a new contact under an organization.
     * @param orgId     The organization that owns this contact
     * @param dataHash  keccak256 of the contact's canonical JSON (name, email, company …)
     * @param didUri    Optional DID URI for decentralized identity
     * @return contactId  The generated unique identifier for this contact
     */
    function registerContact(
        bytes32 orgId,
        bytes32 dataHash,
        string calldata didUri
    )
        external
        whenNotPaused
        onlyAdminOrSales(orgId)
        returns (bytes32 contactId)
    {
        require(dataHash != bytes32(0), "ContactBook: empty hash");
        require(
            _hashIndex[orgId][dataHash] == bytes32(0),
            "ContactBook: duplicate contact hash"
        );

        contactId = keccak256(abi.encodePacked(orgId, dataHash, block.timestamp, msg.sender));

        _contacts[contactId] = Contact({
            id:           contactId,
            orgId:        orgId,
            dataHash:     dataHash,
            registeredBy: msg.sender,
            createdAt:    block.timestamp,
            updatedAt:    block.timestamp,
            active:       true,
            didUri:       didUri
        });

        _orgContacts[orgId].push(contactId);
        _hashIndex[orgId][dataHash] = contactId;

        emit ContactRegistered(contactId, orgId, dataHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Update the data hash for an existing contact (e.g. after PII update off-chain).
     *         Old hash is preserved in the event log for audit purposes.
     */
    function updateContact(bytes32 contactId, bytes32 newHash)
        external
        whenNotPaused
        contactExists(contactId)
    {
        Contact storage c = _contacts[contactId];
        require(c.active, "ContactBook: contact inactive");
        onlyAdminOrSalesCheck(c.orgId);

        require(newHash != bytes32(0), "ContactBook: empty hash");
        require(
            _hashIndex[c.orgId][newHash] == bytes32(0) || _hashIndex[c.orgId][newHash] == contactId,
            "ContactBook: duplicate hash"
        );

        bytes32 oldHash = c.dataHash;
        delete _hashIndex[c.orgId][oldHash];
        _hashIndex[c.orgId][newHash] = contactId;

        c.dataHash  = newHash;
        c.updatedAt = block.timestamp;

        emit ContactUpdated(contactId, c.orgId, oldHash, newHash, block.timestamp);
    }

    /**
     * @notice Soft-delete a contact. Admin only; requires 2 admins for multi-sig safety
     *         (enforced off-chain via the backend multi-sig flow).
     */
    function deactivateContact(bytes32 contactId)
        external
        contactExists(contactId)
    {
        Contact storage c = _contacts[contactId];
        onlyAdminCheck(c.orgId);
        require(c.active, "ContactBook: already inactive");

        c.active    = false;
        c.updatedAt = block.timestamp;

        emit ContactDeactivated(contactId, c.orgId, block.timestamp);
    }

    /**
     * @notice Record GDPR consent grant for a contact.
     */
    function grantConsent(bytes32 contactId)
        external
        contactExists(contactId)
    {
        Contact storage c = _contacts[contactId];
        onlyAdminOrSalesCheck(c.orgId);
        _consentGranted[contactId] = true;
        emit ConsentGranted(contactId, c.orgId, block.timestamp);
    }

    /**
     * @notice Record GDPR consent revocation. Off-chain PII must be erased separately.
     */
    function revokeConsent(bytes32 contactId)
        external
        contactExists(contactId)
    {
        Contact storage c = _contacts[contactId];
        onlyAdminOrSalesCheck(c.orgId);
        _consentGranted[contactId] = false;
        emit ConsentRevoked(contactId, c.orgId, block.timestamp);
    }

    // ─── View Functions ───────────────────────────────────────────────────────────

    function getContact(bytes32 contactId) external view returns (Contact memory) {
        return _contacts[contactId];
    }

    function getOrgContactIds(bytes32 orgId) external view returns (bytes32[] memory) {
        return _orgContacts[orgId];
    }

    function getContactByHash(bytes32 orgId, bytes32 dataHash) external view returns (bytes32) {
        return _hashIndex[orgId][dataHash];
    }

    function hasConsent(bytes32 contactId) external view returns (bool) {
        return _consentGranted[contactId];
    }

    function orgContactCount(bytes32 orgId) external view returns (uint256) {
        return _orgContacts[orgId].length;
    }

    // ─── Internal Helpers ────────────────────────────────────────────────────────

    function onlyAdminOrSalesCheck(bytes32 orgId) internal view {
        uint8 role = registry.getMemberRole(orgId, msg.sender);
        require(role == 1 || role == 2, "ContactBook: insufficient role");
    }

    function onlyAdminCheck(bytes32 orgId) internal view {
        require(registry.getMemberRole(orgId, msg.sender) == 1, "ContactBook: admin only");
    }
}
