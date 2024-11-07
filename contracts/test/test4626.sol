// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";

contract test4626 is ERC4626 {
    constructor(
        string memory name,
        string memory symbol,
        IERC20 asset_
    ) ERC4626(asset_) ERC20(name, symbol) {}

    function _decimalsOffset() internal pure override returns (uint8) {
        return 16;
    }
}
