// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Vesting4626} from "./Vesting4626.sol";
// import {PaymentSplit} from "./PaymentSplit.sol";
import {IV4626Factory} from "./interfaces/IV4626Factory.sol";

contract V4626Factory is IV4626Factory {
    // new a sponsor
    function deploySponsor(
        address router,
        IERC20 asset,
        address owner,
        uint256 amount,
        string memory name,
        string memory symbol
    ) external override returns (address sponsor) {
        sponsor = address(
            new Vesting4626(router, owner, amount, asset, name, symbol)
        );

        return address(sponsor);
    }
}
