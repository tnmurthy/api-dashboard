// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title InvoiceNFT
 * @notice ERC-721 token representing a proof-of-payment invoice.
 *         Minted once per billing period per organization.
 *         Metadata (line items, totals) is stored off-chain (IPFS / Supabase);
 *         the NFT provides an on-chain, unforgeable, transferable proof of payment.
 *
 *         Roles:
 *           MINTER_ROLE  → billing backend (mints after successful payment)
 *           PAUSER_ROLE  → protocol admin
 */
contract InvoiceNFT is ERC721, ERC721URIStorage, AccessControl, Pausable {

    // ─── Roles ───────────────────────────────────────────────────────────────────

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // ─── Structs ─────────────────────────────────────────────────────────────────

    struct Invoice {
        uint256 tokenId;
        bytes32 orgId;
        address paidBy;
        uint256 amountWei;       // amount paid in wei (or stablecoin base units)
        uint256 creditsGranted;  // UsageToken credits minted as a result
        uint256 periodStart;     // billing period start (unix timestamp)
        uint256 periodEnd;       // billing period end
        uint256 issuedAt;
        bytes32 metadataHash;    // keccak256 of the full off-chain invoice JSON
        bool    settled;         // true once usage has been fully reconciled
    }

    // ─── State ───────────────────────────────────────────────────────────────────

    uint256 private _nextTokenId;

    /// tokenId → Invoice
    mapping(uint256 => Invoice) private _invoices;

    /// orgId → list of tokenIds
    mapping(bytes32 => uint256[]) private _orgInvoices;

    /// payer wallet → list of tokenIds
    mapping(address => uint256[]) private _payerInvoices;

    // ─── Events ──────────────────────────────────────────────────────────────────

    event InvoiceMinted(
        uint256 indexed tokenId,
        bytes32 indexed orgId,
        address indexed paidBy,
        uint256 amountWei,
        uint256 creditsGranted,
        uint256 periodStart,
        uint256 periodEnd,
        bytes32 metadataHash,
        uint256 issuedAt
    );
    event InvoiceSettled(uint256 indexed tokenId, uint256 timestamp);

    // ─── Constructor ─────────────────────────────────────────────────────────────

    constructor(address admin)
        ERC721("CRM Invoice", "CRMI")
    {
        require(admin != address(0), "InvoiceNFT: zero admin");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE,        admin);
        _grantRole(MINTER_ROLE,        admin);
    }

    // ─── External Functions ──────────────────────────────────────────────────────

    /**
     * @notice Mint an invoice NFT as proof-of-payment.
     * @param to              Recipient wallet (org owner / payer)
     * @param orgId           Organization this invoice belongs to
     * @param amountWei       Amount paid
     * @param creditsGranted  UsageToken credits granted in return
     * @param periodStart     Billing period start timestamp
     * @param periodEnd       Billing period end timestamp
     * @param metadataHash    keccak256 of off-chain invoice JSON (or IPFS CID hash)
     * @param tokenUri        IPFS URI of the full invoice metadata JSON
     * @return tokenId        The minted NFT token ID
     */
    function mintInvoice(
        address to,
        bytes32 orgId,
        uint256 amountWei,
        uint256 creditsGranted,
        uint256 periodStart,
        uint256 periodEnd,
        bytes32 metadataHash,
        string  calldata tokenUri
    )
        external
        onlyRole(MINTER_ROLE)
        whenNotPaused
        returns (uint256 tokenId)
    {
        require(to             != address(0), "InvoiceNFT: zero recipient");
        require(orgId          != bytes32(0), "InvoiceNFT: zero orgId");
        require(metadataHash   != bytes32(0), "InvoiceNFT: empty metadata hash");
        require(periodEnd       > periodStart, "InvoiceNFT: invalid period");

        tokenId = _nextTokenId++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenUri);

        _invoices[tokenId] = Invoice({
            tokenId:        tokenId,
            orgId:          orgId,
            paidBy:         to,
            amountWei:      amountWei,
            creditsGranted: creditsGranted,
            periodStart:    periodStart,
            periodEnd:      periodEnd,
            issuedAt:       block.timestamp,
            metadataHash:   metadataHash,
            settled:        false
        });

        _orgInvoices[orgId].push(tokenId);
        _payerInvoices[to].push(tokenId);

        emit InvoiceMinted(
            tokenId, orgId, to, amountWei, creditsGranted,
            periodStart, periodEnd, metadataHash, block.timestamp
        );
    }

    /**
     * @notice Mark an invoice as fully settled (usage reconciled).
     */
    function settleInvoice(uint256 tokenId)
        external
        onlyRole(MINTER_ROLE)
    {
        require(_invoices[tokenId].issuedAt != 0, "InvoiceNFT: token not found");
        require(!_invoices[tokenId].settled,       "InvoiceNFT: already settled");
        _invoices[tokenId].settled = true;
        emit InvoiceSettled(tokenId, block.timestamp);
    }

    // ─── View Functions ───────────────────────────────────────────────────────────

    function getInvoice(uint256 tokenId) external view returns (Invoice memory) {
        require(_invoices[tokenId].issuedAt != 0, "InvoiceNFT: token not found");
        return _invoices[tokenId];
    }

    function getOrgInvoices(bytes32 orgId) external view returns (uint256[] memory) {
        return _orgInvoices[orgId];
    }

    function getPayerInvoices(address payer) external view returns (uint256[] memory) {
        return _payerInvoices[payer];
    }

    function totalInvoices() external view returns (uint256) {
        return _nextTokenId;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────────

    function pause()   external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    // ─── Required Overrides ───────────────────────────────────────────────────────

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
