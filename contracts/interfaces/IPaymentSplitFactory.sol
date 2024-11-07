// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract IPaymentSplitFactory {
    // new a company
    function deployCompany(
        address router,
        IERC20 asset,
        address owner,
        string memory name,
        string memory symbol
    ) external virtual returns (address company) {}
}
