// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract IV4626Factory {
    // new a sponsor
    function deploySponsor(
        address router,
        IERC20 asset,
        address owner,
        uint256 amount,
        string memory name,
        string memory symbol
    ) external virtual returns (address sponsor) {}
}
