// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title UsageToken
 * @notice ERC-20 token representing API usage credits within the CRM platform.
 *
 *         Credit model:
 *           • 1 token = 1,000 API tokens (configurable via creditRatio)
 *           • Users purchase (mint) credits; the billing contract deducts them per API call.
 *           • Credits are non-transferable by default (soulbound-lite) to prevent speculation.
 *           • Governance can enable transfers for marketplace scenarios.
 *
 *         Roles:
 *           MINTER_ROLE  → billing backend / payment contract (mints on purchase)
 *           BURNER_ROLE  → billing contract (burns on API usage deduction)
 *           PAUSER_ROLE  → protocol admin
 */
contract UsageToken is ERC20, ERC20Burnable, ERC20Permit, AccessControl, Pausable {

    // ─── Roles ───────────────────────────────────────────────────────────────────

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // ─── State ───────────────────────────────────────────────────────────────────

    /// 1 token covers this many API tokens (e.g. 1000 = 1 credit per 1k tokens)
    uint256 public creditRatio;

    /// Whether token transfers are enabled (default: false / soulbound-lite)
    bool public transfersEnabled;

    /// Wallet → staked amount (staked credits are locked for billing deduction)
    mapping(address => uint256) public stakedBalance;

    // ─── Events ──────────────────────────────────────────────────────────────────

    event CreditsStaked(address indexed account, uint256 amount);
    event CreditsUnstaked(address indexed account, uint256 amount);
    event CreditsDeducted(address indexed account, uint256 amount, bytes32 indexed usageRef);
    event CreditRatioUpdated(uint256 oldRatio, uint256 newRatio);
    event TransfersToggled(bool enabled);

    // ─── Constructor ─────────────────────────────────────────────────────────────

    /**
     * @param admin        Initial default admin
     * @param _creditRatio Initial ratio (e.g. 1000 means 1 token = 1k API tokens)
     */
    constructor(address admin, uint256 _creditRatio)
        ERC20("CRM Usage Credit", "CRMC")
        ERC20Permit("CRM Usage Credit")
    {
        require(admin != address(0), "UsageToken: zero admin");
        require(_creditRatio > 0,   "UsageToken: zero ratio");

        creditRatio = _creditRatio;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE,        admin);
        _grantRole(MINTER_ROLE,        admin); // admin can mint initially; hand off to billing contract
    }

    // ─── External Functions ──────────────────────────────────────────────────────

    /**
     * @notice Mint credits to an account (called by payment gateway / billing contract).
     */
    function mint(address to, uint256 amount)
        external
        onlyRole(MINTER_ROLE)
        whenNotPaused
    {
        _mint(to, amount);
    }

    /**
     * @notice Stake credits to lock them for billing deduction.
     *         Staked credits cannot be transferred but can be deducted by the billing contract.
     */
    function stake(uint256 amount) external whenNotPaused {
        require(balanceOf(msg.sender) >= amount, "UsageToken: insufficient balance");
        stakedBalance[msg.sender] += amount;
        _transfer(msg.sender, address(this), amount);
        emit CreditsStaked(msg.sender, amount);
    }

    /**
     * @notice Unstake credits (return from contract to user's wallet).
     */
    function unstake(uint256 amount) external whenNotPaused {
        require(stakedBalance[msg.sender] >= amount, "UsageToken: insufficient staked");
        stakedBalance[msg.sender] -= amount;
        _transfer(address(this), msg.sender, amount);
        emit CreditsUnstaked(msg.sender, amount);
    }

    /**
     * @notice Deduct staked credits for API usage.
     *         Called by the billing contract after each metered usage event.
     * @param account    User's wallet
     * @param amount     Credits to deduct
     * @param usageRef   Reference hash (ActivityLedger entry index or invoice ID)
     */
    function deduct(address account, uint256 amount, bytes32 usageRef)
        external
        onlyRole(BURNER_ROLE)
        whenNotPaused
    {
        require(stakedBalance[account] >= amount, "UsageToken: insufficient staked credits");
        stakedBalance[account] -= amount;
        _burn(address(this), amount);
        emit CreditsDeducted(account, amount, usageRef);
    }

    /**
     * @notice Update the credit-to-API-token ratio.
     */
    function setCreditRatio(uint256 newRatio)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(newRatio > 0, "UsageToken: zero ratio");
        emit CreditRatioUpdated(creditRatio, newRatio);
        creditRatio = newRatio;
    }

    /**
     * @notice Toggle whether tokens can be transferred between wallets.
     */
    function setTransfersEnabled(bool enabled)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        transfersEnabled = enabled;
        emit TransfersToggled(enabled);
    }

    // ─── Overrides ───────────────────────────────────────────────────────────────

    function _update(address from, address to, uint256 value)
        internal
        override
        whenNotPaused
    {
        // Allow mints (from == 0), burns (to == 0), stake/unstake (contract address),
        // and transfers only if enabled
        if (from != address(0) && to != address(0) && from != address(this) && to != address(this)) {
            require(transfersEnabled, "UsageToken: transfers disabled");
        }
        super._update(from, to, value);
    }

    // ─── Admin ────────────────────────────────────────────────────────────────────

    function pause()   external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }
}
