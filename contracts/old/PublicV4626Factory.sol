// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {PublicV4626} from "./PublicV4626.sol";
import {IPublicV4626Factory} from "./interfaces/IPublicV4626Factory.sol";

contract PublicV4626Factory is IPublicV4626Factory {
    // Event to log the deployment of a new sponsor
    event SponsorDeployed(
        address indexed owner,
        address sponsorAddress,
        address router,
        uint256 amount,
        address company,
        string name,
        string symbol
    );

    // new a sponsor
    function deploySponsor(
        address router,
        IERC20 asset,
        address owner,
        uint256 amount,
        address company,
        string memory name,
        string memory symbol
    ) external override returns (address sponsor) {
        sponsor = address(
            new PublicV4626(router, owner, amount, asset, company, name, symbol)
        );

        emit SponsorDeployed(
            owner,
            sponsor,
            router,
            amount,
            company,
            name,
            symbol
        );

        return address(sponsor);
    }
}
