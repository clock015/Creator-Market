// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";

contract MyERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(_msgSender(), 1000 ether);
    }

    function mint() public {
        _mint(_msgSender(), 1000 ether);
    }
}