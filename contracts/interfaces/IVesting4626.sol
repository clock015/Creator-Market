// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";

interface IVesting4626 is IERC4626 {
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
        uint256 timestamp
    );
    event CapitalIncreased(uint256 amount);
    event TotalAssetsAndSupplyUpdated(
        uint256 time,
        uint256 totalAssets,
        uint256 totalSupply
    );

    // Functions
    function releasable(address creator_) external view returns (uint256);

    function totalAccumulatedSalary() external view returns (uint256);

    function totalPendingSalary() external view returns (uint256);

    function salaryToSps(uint256 salary) external pure returns (uint256);

    function spsToSalary(uint256 sps) external pure returns (uint256);

    function release(address creator_) external returns (uint256);

    function updateSalary(address creator_, uint256 amount) external;

    function increaseRegisteredCapital(uint256 amount) external;

    function finishUpdate(address creator_) external;

    function updateOldTotalAccumulatedSalary() external;

    function callClaim() external;

    function callAllClaim() external;
    
    // Public view functions
    function totalSps() external view returns (uint256);
    function pendingSps() external view returns (int256);
    function minPendingSps() external view returns (uint256);
    function salaryDataOf(address creator_) external view returns (uint256 currentSps, uint256 lastReleaseAt);
    function updateDataOf(address creator_) external view returns (uint256 expectedSps, uint256 updateTime);
}
