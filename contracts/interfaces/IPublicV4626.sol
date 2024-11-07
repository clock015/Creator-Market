// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IVesting4626.sol";

interface IPublicV4626 is IVesting4626 {
    // Check whether the contract is publicly listed
    function isPublic() external view returns (bool);

    // Returns the last update time
    function lastUpdated() external view returns (uint256);

    // Returns the total shares of the last day
    function lastTotalShares() external view returns (uint256);

    // Deposit assets and return the number of shares minted
    function deposit(
        uint256 assets,
        address receiver
    ) external returns (uint256);

    // Mint shares and return the amount of assets
    function mint(uint256 shares, address receiver) external returns (uint256);

    // Withdraw assets and return the number of shares
    function withdraw(
        uint256 assets,
        address receiver,
        address owner
    ) external returns (uint256);

    // Redeem shares and return the amount of assets
    function redeem(
        uint256 shares,
        address receiver,
        address owner
    ) external returns (uint256);

    // Make the contract public, irreversible
    function turnPublic() external;

    // Check if the new total shares are within the allowed range
    function _checkTotalShares(uint256 newTotalShares) external view;

    // Update the total shares
    function _updateTotalShares() external;

    // Get the token of the current contract
    function asset() external view returns (IERC20);
}
