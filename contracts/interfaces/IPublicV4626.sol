// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IVesting4626} from "./IVesting4626.sol";

interface IPublicV4626 is IVesting4626 {
    // Check whether the contract is publicly listed
    function isPublic() external view returns (bool);

    // Returns the last update time
    function lastUpdated() external view returns (uint256);

    // Returns the total shares of the last day
    function lastTotalShares() external view returns (uint256);

    // limit depositing and withdrawing assets (10%)  
    function allowedDeviation() external view returns (uint256);

    // Make the contract public, irreversible
    function turnPublic() external;

    // Events
    event TurnPublicAt(uint256 timestamp);
}
