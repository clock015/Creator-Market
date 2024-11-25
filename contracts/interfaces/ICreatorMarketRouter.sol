// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Interface for the CreatorMarketRouter contract
interface ICreatorMarketRouter {
    // Events
    event SponsorUpdated(
        address indexed creator,
        address indexed sponsor,
        bool isAdded
    );

    event CompanyUpdated(
        address indexed creator,
        address indexed company,
        bool isAdded
    );

    // Functions
    // Function to create a new company and sponsor
    function newCompany(
        string memory name,
        string memory symbol
    ) external returns (address company, address sponsor);

    // Function to add a sponsor to a creator
    function updateSponsorsOf(address creator) external;

    // Function to remove a sponsor from a creator
    function deleteSponsorsOf(address creator) external;

    // Function to add a company to a creator
    function updateCompaniesOf(address creator) external;

    // Function to remove a company from a creator
    function deleteCompaniesOf(address creator) external;

    // View function to get the list of sponsors of a creator
    function getSponsorsOf(
        address creator
    ) external view returns (address[] memory);

    // View function to get the list of companies of a creator
    function getCompaniesOf(
        address creator
    ) external view returns (address[] memory);

    // View function to get the list of companies founded by a creator
    function getCompaniesFoundedBy(
        address creator
    ) external view returns (address[] memory);

    // Public functions to access mappings for checking if an address is a company or sponsor
    function isCompany(address company) external view returns (bool);

    function isSponsor(address sponsor) external view returns (bool);

    // Public function to get the equity holder for a company
    function equityOf(address company) external view returns (address);
}
