// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ICreatorMarketRouter {
    // Function to create a new company and sponsor
    function newCompany(
        string memory name,
        string memory symbol
    ) external returns (address company, address sponsor);

    // Function to update the sponsor of a creator
    function updateSponsorsOf(address creator) external;

    // Function to delete a sponsor of a creator
    function deleteSponsorsOf(address creator) external;

    // Function to update the company of a creator
    function updateCompaniesOf(address creator) external;

    // Function to delete a company of a creator
    function deleteCompaniesOf(address creator) external;

    // View function to get the list of sponsors for a creator
    function getSponsorsOf(address creator) external view returns (address[] memory);

    // View function to get the list of companies for a creator
    function getCompaniesOf(address creator) external view returns (address[] memory);

    // Get the asset token being used in the market
    function asset() external view returns (IERC20);
}
