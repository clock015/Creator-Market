// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IPaymentSplit is IERC20 {
    // Events
    event ClaimExecuted(address indexed account, uint256 amount);
    event ReleaseCalled(address[] sponsors, uint256 amount);

    // Functions
    function claim(address account) external returns (uint256);

    function claimable(address account) external view returns (uint256);

    function getTotalHeight() external view returns (uint256);

    function callRelease() external;

    function conditionalCallRelease() external;
    
    // Public view functions
    function totalReleased() external view returns (uint256);
    function height(address account) external view returns (uint256);
    function lastCallReleaseTime() external view returns (uint256);
    function _asset() external view returns (address);
}
