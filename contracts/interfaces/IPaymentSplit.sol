// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IPaymentSplit {
    // Event emitted when a beneficiary releases a payment
    event PaymentReleased(address to, uint256 amount);

    // Returns the total amount released to the beneficiary
    function totalReleased() external view returns (uint256);

    // Returns the height of the fund pool at the time of the beneficiary's last claim
    function height(address account) external view returns (uint256);

    // Asset token address
    function _asset() external view returns (IERC20);

    // Router contract address
    function _router() external view returns (address);

    // Transfer function
    function transfer(address to, uint256 value) external returns (bool);

    // Allows transferring from another account
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool);

    // Beneficiary claims the allocated funds
    function claim(address account) external;

    // Calculates the amount of funds a specific account can claim
    function claimable(address account) external view returns (uint256);

    // Returns the total height of the fund pool's income
    function getTotalHeight() external view returns (uint256);

    // Calls the Router contract to release salary from sponsors
    function callRelease() external;
}
