// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IVesting4626 {
    // Calculate the releasable salary
    function releasable(address creator_) external view returns (uint256);

    // Calculate the total historically accumulated salary within the protocol
    function totalAccumulatedSalary() external view returns (uint256);

    // Calculate the total pending salary within the protocol
    function totalPendingSalary() external view returns (uint256);

    // Convert monthly salary to per-second salary
    function salaryToSps(uint256 salary) external pure returns (uint256);

    /** @dev Returns the total assets in the contract */
    function totalAssets() external view returns (uint256);

    // Release salary
    function release(address creator_) external;

    // Schedule salary update
    function updateSalary(address creator_, uint256 amount) external;

    // Increase registered capital
    function increaseRegisteredCapital(uint256 amount) external;

    // Decrease registered capital
    function decreaseRegisteredCapital(uint256 amount) external;

    // Complete the salary update
    function finishUpdate(address creator_) external;

    // Update the total accumulated salary
    function updateOldTotalAccumulatedSalary() external;

    // Call the claim function in the PaymentSplit contract
    function callClaim() external;

    // State variable getter functions
    function totalSps() external view returns (uint256);

    function waitingSps() external view returns (int256);

    function minWaitingSps() external view returns (uint256);

    function totalReleased() external view returns (uint256);

    function oldTotalAccumulatedSalary() external view returns (uint256);

    function lastReleaseAt() external view returns (uint256);

    function waitingTime() external view returns (uint256);

    function salaryDataOf(
        address creator_
    ) external view returns (uint256 currentSps, uint256 lastReleaseAt);

    function updateDataOf(
        address creator_
    )
        external
        view
        returns (bool waitUpdate, uint256 expectedSps, uint256 updateTime);
}
