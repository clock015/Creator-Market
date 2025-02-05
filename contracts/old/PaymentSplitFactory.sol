// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {PaymentSplit} from "./PaymentSplit.sol";
import {IPaymentSplitFactory} from "./interfaces/IPaymentSplitFactory.sol";

contract PaymentSplitFactory is IPaymentSplitFactory {
    // Event emitted when a new company is deployed
    event CompanyDeployed(
        address indexed owner,
        address companyAddress,
        address router,
        string name,
        string symbol
    );

    // Deploy a new company contract
    function deployCompany(
        address router,
        IERC20 asset,
        address owner,
        string memory name,
        string memory symbol
    ) external override returns (address company) {
        // Deploy a new PaymentSplit contract
        company = address(new PaymentSplit(router, asset, owner, name, symbol));

        // Emit event with new company details
        emit CompanyDeployed(owner, company, router, name, symbol);

        return address(company);
    }
}
