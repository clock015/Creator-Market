// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IV4626Router {
    // Create a new company
    function newCompany(string memory name, string memory symbol) external;

    // List equity shares
    function listEquity(uint256 amount) external;

    // Update the sponsors of the creator
    function updateSponsorsOf(address creator) external;

    // Remove a sponsor from the creator's sponsors list
    function deleteSponsorsOf(address creator) external;

    // Update the companies associated with the creator
    function updateCompaniesOf(address creator) external;

    // Remove a company from the creator's companies list
    function deleteCompaniesOf(address creator) external;

    // Get all sponsors of a creator
    function getSponsorsOf(
        address creator
    ) external view returns (address[] memory);

    // Get all companies of a creator
    function getCompaniesOf(
        address creator
    ) external view returns (address[] memory);

    // State variable getter functions
    function isCreator(address account) external view returns (bool);

    function isCompany(address account) external view returns (bool);

    function isSponsor(address account) external view returns (bool);

    function sponsorsOf(
        address creator
    ) external view returns (address[] memory);

    function companiesOf(
        address creator
    ) external view returns (address[] memory);

    function equityOf(address company) external view returns (address);

    function _asset() external view returns (address);
}
