// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

interface IInvestment {
    function totalInvestment() external view returns (uint256);
    function investmentOf(address account) external view returns (uint256);
}

/**
 * @title IncomeSplit
 * @dev ERC20-based income distribution system with investment tracking capabilities.
 * Features:
 * - Automated profit distribution proportional to token holdings
 * - Integrated investment tracking system
 * - ERC20Permit support for meta-transactions
 * - Safe asset transfers with reentrancy protection
 * - Real-time claimable amount calculation
 */
contract IncomeSplit is ERC20, ERC20Permit {
    using Math for uint256;
    /// @notice Underlying payment asset (ERC20)
    IERC20 public immutable _asset;
    /// @notice Investment tracking contract interface
    IInvestment public immutable _investment;

    /// @notice Total amount released to all beneficiaries
    uint256 public totalReleased; 
    /// @notice Total amount released through investment contracts
    uint256 public investmentReleased; 

    /**
     * @dev Tracks last received amount per account:
     * - Key: beneficiary address
     * - Value: snapshot of totalReceived at last claim
     */
    mapping(address => uint256) public lastTotalReceived;

    /**
     * @dev Tracks claimed amounts from investment:
     * - Key: investor address
     * - Value: total amount already claimed
     */
    mapping(address => uint256) public claimedFromInvestment;

    /// @notice Emitted when a beneficiary claims funds
    event ClaimExecuted(address indexed account, uint256 amount);

    /**
     * @dev Initialize payment distribution system
     * @param asset_ Underlying ERC20 payment token
     * @param owner Initial token holder and contract controller
     * @param name ERC20 token name
     * @param symbol ERC20 token symbol
     * @param investment_ Investment tracking contract
     */
    constructor(
        IERC20 asset_,
        address owner,
        string memory name,
        string memory symbol,
        IInvestment investment_
    ) ERC20(name, symbol) ERC20Permit(name) {
        _asset = asset_;
        _investment = investment_;
        _mint(owner, 10 ** decimals());
    }

    /**
     * @notice Override ERC20 transfer with auto-claim logic
     * @dev Performs pre-transfer claims for both parties
     * @param to Recipient address
     * @param value Transfer amount
     * @return success Transfer operation result
     * Special handling for investment contract transfers:
     * - Updates investmentReleased tracking
     * - Maintains accounting consistency
     */
    function transfer(
        address to,
        uint256 value
    ) public virtual override returns (bool) {
        // claim
        address owner = _msgSender();
        claim(owner);
        if(to != address(_investment)){
            claim(to);
        }

        _transfer(owner, to, value);
        // transfer lastTotalReceived data
        if(to == address(_investment)){
            uint256 totalReceived = getTotalReceived();
            uint256 released = Math.mulDiv(
                totalReceived,
                value,
                totalSupply(),
                Math.Rounding.Ceil
            );
            investmentReleased += released;
        }else {
            lastTotalReceived[to] = lastTotalReceived[owner];
        }

        return true;
    }

    /**
     * @notice Override ERC20 transferFrom with auto-claim logic
     * @dev Performs pre-transfer claims for both parties
     * @param from Source address
     * @param to Recipient address
     * @param value Transfer amount
     * @return success Transfer operation result
     * Maintains accounting consistency for investment transfers
     */
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public virtual override returns (bool) {
        // claim
        claim(from);
        if(to != address(_investment)){
            claim(to);
        }

        address spender = _msgSender();
        _spendAllowance(from, spender, value);
        _transfer(from, to, value);
        // transfer lastTotalReceived data
        if(to == address(_investment)){
            uint256 totalReceived = getTotalReceived();
            uint256 released = Math.mulDiv(
                totalReceived,
                value,
                totalSupply(),
                Math.Rounding.Ceil
            );
            investmentReleased += released;
        }else {
            lastTotalReceived[to] = lastTotalReceived[from];
        }

        return true;
    }

    /**
     * @notice Claim available funds for an account
     * @dev Combines token-based and investment-based claims
     * @param _account Beneficiary address
     * @return payment Total claimed amount
     * Requirements:
     * - Cannot claim for investment contract address
     * - Executes asset transfer if payment > 0
     */
    function claim(address _account) public virtual returns (uint256) {

        require(_account != address(_investment),"can not claim for investment");
        uint256 payment = 0;
        // Check if the beneficiary is valid
        if (balanceOf(_account) > 0) {
            uint256 profitOnToken = claimable(_account);
            // Calculate the amount the beneficiary is entitled to in ETH
            payment += profitOnToken;

            // Update the beneficiary's current lastTotalReceived
            lastTotalReceived[_account] = getTotalReceived();
            // Update the total released amount
            totalReleased += profitOnToken;
        }

        uint256 profitOnInvestment = claimableOnInvestment(_account);
        if(profitOnInvestment > 0) {
            claimedFromInvestment[_account] += profitOnInvestment;
            totalReleased += profitOnInvestment;
            payment += profitOnInvestment;
        }
        
        if(payment > 0) {
            // Emit event for the beneficiary's withdrawal
            emit ClaimExecuted(_account, payment);
            // Transfer the funds
            SafeERC20.safeTransfer(_asset, _account, payment);
        }
        
        return payment;
    }

    /**
     * @notice Calculate token-based claimable amount
     * @param _account Beneficiary address
     * @return amount Available amount proportional to token holdings
     */
    function claimable(address _account) public view returns (uint256) {
        // Calculate the total income of the contract, which is the accumulated total amount
        uint256 totalReceived = getTotalReceived();
        // Beneficiary's entitled amount = total entitled amount - amount already claimed
        return
            Math.mulDiv(
                (totalReceived - lastTotalReceived[_account]),
                balanceOf(_account),
                totalSupply()
            );
    }

    /**
     * @notice Calculate investment-based claimable amount
     * @param account Investor address
     * @return amount Available investment returns
     * Calculates pro-rata share based on investment contribution
     */
    function claimableOnInvestment(address account) public view returns (uint256) {
        uint256 investment = _investment.investmentOf(account);
        if (investment == 0) {
            return 0;
        }
        uint256 profit = returnOnInvestment();
        uint256 totalInvestment = _investment.totalInvestment();
        uint256 alreadyClaimed = claimedFromInvestment[account];
        uint256 entitlement = Math.mulDiv(
                    profit,
                    investment,
                    totalInvestment
                );
        if (entitlement > alreadyClaimed) {
            return entitlement - alreadyClaimed;
        } else {
            return 0;
        }
    }

    /**
     * @notice Calculate total available investment returns
     * @return amount Total unclaimed investment profits
     */
    function returnOnInvestment() public view returns (uint256) {

        uint256 totalReceived = getTotalReceived();

        return
            Math.mulDiv(
                totalReceived,
                balanceOf(address(_investment)),
                totalSupply()
            ) - investmentReleased;
    }

    /**
     * @notice Get total received assets in system
     * @return amount Current balance + historical releases
     * Represents cumulative incoming payments to the contract
     */
    function getTotalReceived() public view returns (uint256) {
        // Calculate the total income of the split contract, which is the accumulated total amount
        uint256 totalReceived = _asset.balanceOf(address(this)) + totalReleased;
        return totalReceived;
    }
}