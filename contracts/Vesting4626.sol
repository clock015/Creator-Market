// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

/**
 * @title Vesting4626
 * @dev ERC4626-based vesting vault with dynamic salary streaming capabilities.
 * Features:
 * - Salary streaming with per-second granularity
 * - Scheduled salary adjustments with configurable waiting period
 * - Real-time tracking of vested/unvested funds
 * - Owner-managed salary configurations
 */
contract Vesting4626 is Context, Ownable, ERC4626 {
    /// @notice Total salary per second (in wei) across all participants
    uint256 public totalSps;
    /// @notice Total amount of released funds from the vault
    uint256 private totalReleased;
    /// @notice Historical accumulator for total vested salary
    uint256 private oldTotalAccumulatedSalary;
    /// @notice Last timestamp when total accumulated salary was updated
    uint256 private lastReleaseAt;
    /// @notice Waiting period for salary changes
    // it should be 7 days, but now adjustment it to 0 for testing
    uint256 private constant waitingTime = 0;

    /// @notice Individual salary configuration per address
    struct SalaryData {
        uint256 currentSps; // Current salary per second (wei/sec)
        uint256 lastReleaseAt; // Last salary release timestamp
    }
    mapping(address => SalaryData) public salaryDataOf;

    /// @notice Pending salary updates scheduled for addresses
    struct UpdateData {
        uint256 expectedSps; // New salary per second after update
        uint256 updateTime; // Effective timestamp for update
    }
    mapping(address => UpdateData) public updateDataOf;

    /// @notice Total deposited assets per address (in underlying token)
    mapping(address => uint256) public totalDeposit;
    /// @notice Temporarily record the pending salary under bankruptcy status
    mapping(address => uint256) public pendingRelease;

    // Events
    event SalaryReleased(address indexed creator, uint256 amount);
    event SalaryUpdateScheduled(
        address indexed creator,
        uint256 updateTime,
        uint256 currentAmount,
        uint256 pendingAmount
    );
    event SalaryUpdateFinished(
        address indexed creator,
        uint256 amount,
        uint256 time
    );

    /**
     * @dev Initialize the vesting vault
     * @param owner_ Contract administrator address
     * @param token_ Underlying ERC20 token address
     * @param name Name for vault shares token
     * @param symbol Symbol for vault shares token
     */
    constructor(
        address owner_,
        IERC20 token_,
        string memory name,
        string memory symbol
    ) Ownable(owner_) ERC4626(token_) ERC20(name, symbol) {}

    /**
     * @notice Calculate unvested investment amount for an account
     * @param account Target account address
     * @return Investment amount contributed by the account
     */
    function investmentOfV2(address account) public view returns (uint256) {
        return
            totalDeposit[account] -
            _convertToAssets(balanceOf(account), Math.Rounding.Floor);
    }

    /**
     * @dev Offset for shares token decimals (8 decimals)
     */
    function _decimalsOffset() internal pure override returns (uint8) {
        return 8;
    }

    /**
     * @notice Calculate total invested capital in the vault
     * @return Minimum between current balance + released and total accumulated salary
     */
    function totalInvestment() public view returns (uint256) {
        uint256 balance = IERC20(asset()).balanceOf(address(this));
        uint256 totalSalary = totalAccumulatedSalary();
        uint256 totalReleased_ = totalReleased;
        if (balance + totalReleased_ > totalSalary) {
            return totalSalary;
        } else {
            return balance + totalReleased_;
        }
    }

    /**
     * @notice Calculate releasable salary for a creator
     * @param creator_ Target beneficiary address
     * @return amount Available for release in wei
     */
    function releasable(
        address creator_
    ) public view virtual returns (uint256) {
        uint256 timeElapsed = block.timestamp -
            salaryDataOf[creator_].lastReleaseAt;
        return
            Math.mulDiv(salaryDataOf[creator_].currentSps, timeElapsed, 1) +
            pendingRelease[creator_];
    }

    /**
     * @notice Calculate total accumulated salary since inception
     * @return Historical total salary including current pending
     */
    function totalAccumulatedSalary() public view returns (uint256) {
        uint256 timeDifference = block.timestamp - lastReleaseAt;
        return
            oldTotalAccumulatedSalary +
            Math.mulDiv(totalSps, timeDifference, 1);
    }

    /**
     * @notice Get current pending salary across all participants
     * @return Total unclaimed salary in the system
     */
    function totalPendingSalary() public view returns (uint256) {
        return totalAccumulatedSalary() - totalReleased;
    }

    /**
     * @notice Convert monthly salary amount to per-second rate
     * @param salary Monthly salary in wei
     * @return sps Per-second salary rate (wei/sec)
     */
    function salaryToSps(uint256 salary) public pure returns (uint256) {
        return Math.mulDiv(salary, 1, 30 days);
    }

    /**
     * @notice Convert per-second rate to monthly salary amount
     * @param sps Per-second salary rate (wei/sec)
     * @return Estimated monthly salary in wei
     */
    function spsToSalary(uint256 sps) public pure returns (uint256) {
        return Math.mulDiv(sps, 30 days, 1);
    }

    /** @dev See {IERC4626-totalAssets}. */
    function totalAssets() public view virtual override returns (uint256) {
        uint256 balance = IERC20(asset()).balanceOf(address(this));
        uint256 pendingSalary = totalPendingSalary();

        if (balance >= pendingSalary) {
            return balance - pendingSalary;
        }
        return 0;
    }

    /**
     * @notice Release available salary for a creator
     * @dev Updates global accounting state before transfer
     * @param creator_ Target beneficiary address
     * @return amount Actually released amount
     */
    function release(address creator_) public returns (uint256 amount) {
        updateOldTotalAccumulatedSalary();

        amount = releasable(creator_);
        pendingRelease[creator_] = 0;
        salaryDataOf[creator_].lastReleaseAt = block.timestamp;

        totalReleased += amount;
        SafeERC20.safeTransfer(IERC20(asset()), creator_, amount);
        emit SalaryReleased(creator_, amount);

        return amount;
    }

    /**
     * @notice Schedule salary update (owner only)
     * @dev Changes take effect after waiting period
     * @param creator_ Target beneficiary address
     * @param amount New monthly salary in wei
     */
    function updateSalary(address creator_, uint256 amount) public onlyOwner {
        uint256 salary = salaryToSps(amount);
        uint256 currentSps = salaryDataOf[creator_].currentSps;
        require(
            updateDataOf[creator_].updateTime == 0,
            "salary is waiting update"
        );
        require(salary != currentSps, "salary is equal to old one");

        require(
            salary <= uint256(type(int256).max),
            "Value exceeds int256 max range"
        );

        updateDataOf[creator_].updateTime = block.timestamp + waitingTime;
        updateDataOf[creator_].expectedSps = salary;

        emit SalaryUpdateScheduled(
            creator_,
            updateDataOf[creator_].updateTime,
            spsToSalary(currentSps),
            amount
        );
    }

    /**
     * @notice Execute scheduled salary update after waiting period
     * @dev 1. Releases pending salary 2. Updates salary rate 3. Clears update data
     * @param creator_ Target beneficiary address
     */
    function finishUpdate(address creator_) public {
        require(updateDataOf[creator_].updateTime != 0, "nothing need update");
        require(
            updateDataOf[creator_].updateTime <= block.timestamp,
            "Not time for update yet"
        );
        // release salary
        updateOldTotalAccumulatedSalary();
        uint256 amount = releasable(creator_);
        pendingRelease[creator_] = amount;
        salaryDataOf[creator_].lastReleaseAt = block.timestamp;
        // update salary
        totalSps =
            totalSps -
            salaryDataOf[creator_].currentSps +
            updateDataOf[creator_].expectedSps;

        salaryDataOf[creator_].currentSps = updateDataOf[creator_].expectedSps;
        delete updateDataOf[creator_];

        emit SalaryUpdateFinished(
            creator_,
            spsToSalary(salaryDataOf[creator_].currentSps),
            block.timestamp
        );
    }

    /**
     * @dev Update global salary accumulator
     * @notice Should be called before any state-changing operations
     */
    function updateOldTotalAccumulatedSalary() public {
        uint256 timeElapsed = block.timestamp - lastReleaseAt;
        oldTotalAccumulatedSalary += Math.mulDiv(totalSps, timeElapsed, 1);
        lastReleaseAt = block.timestamp;
    }

    /**
     * @dev Override deposit to track original investments
     * @notice Updates deposit tracking during deposit operations
     */
    function _deposit(
        address caller,
        address receiver,
        uint256 assets,
        uint256 shares
    ) internal virtual override {
        uint256 balance = IERC20(asset()).balanceOf(address(this));
        uint256 pendingSalary = totalPendingSalary();
        if (balance > pendingSalary) {
            super._deposit(caller, receiver, assets, shares);
        } else if (balance + assets > pendingSalary) {
            uint256 adjustedAssets = balance + assets - pendingSalary;
            uint256 adjustedShares = previewDeposit(adjustedAssets);

            SafeERC20.safeTransferFrom(
                IERC20(asset()),
                caller,
                address(this),
                assets
            );
            _mint(receiver, adjustedShares);
            emit Deposit(caller, receiver, assets, adjustedShares);
        } else {
            SafeERC20.safeTransferFrom(
                IERC20(asset()),
                caller,
                address(this),
                assets
            );
            emit Deposit(caller, receiver, assets, 0);
        }

        totalDeposit[receiver] += assets;
    }

    /**
     * @dev Override withdraw to update investment tracking
     * @notice Adjusts deposit records during withdrawals
     */
    function _withdraw(
        address caller,
        address receiver,
        address owner,
        uint256 assets,
        uint256 shares
    ) internal virtual override {
        super._withdraw(caller, receiver, owner, assets, shares);

        totalDeposit[caller] -= assets;
    }

    /**
     * @dev Internal hook for share transfers
     * @notice Updates deposit tracking during transfers
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal virtual override {
        uint256 assets = _convertToAssets(value, Math.Rounding.Floor);

        super._update(from, to, value);

        if (from != address(0) && to != address(0)) {
            totalDeposit[from] -= assets;
            totalDeposit[to] += assets;
        }
    }
}
