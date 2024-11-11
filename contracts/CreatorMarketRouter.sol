// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
// import {Vesting4626} from "./Vesting4626.sol";
// import {PaymentSplit} from "./PaymentSplit.sol";
import {IPublicV4626Factory} from "./interfaces/IPublicV4626Factory.sol";
import {IPaymentSplitFactory} from "./interfaces/IPaymentSplitFactory.sol";

contract CreatorMarketRouter {
    // Factory
    IPublicV4626Factory _publicV4626Factory;
    IPaymentSplitFactory _paymentSplitFactory;
    // asset
    IERC20 public immutable _asset;
    // all creator
    mapping(address => bool) public isCreator;
    // whether address is company
    mapping(address => bool) public isCompany;
    // whether address is sponsor
    mapping(address => bool) public isSponsor;
    // all sponsors of company
    mapping(address => address[]) public sponsorsOf;
    // all companies of creator
    mapping(address => address[]) public companiesOf;
    // equity of company
    mapping(address => address) public equityOf;

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

    constructor(
        IERC20 asset_,
        IPublicV4626Factory publicV4626Factory_,
        IPaymentSplitFactory paymentSplitFactory_
    ) {
        _asset = asset_;
        _publicV4626Factory = publicV4626Factory_;
        _paymentSplitFactory = paymentSplitFactory_;
    }

    // interact with user
    // new a company
    function newCompany(
        string memory name,
        string memory symbol
    ) public returns (address company, address sponsor) {
        // new a company, use "Company" suffix for name and "COMP" for symbol
        string memory companyName = string(abi.encodePacked(name, " Company"));
        string memory companySymbol = string(abi.encodePacked(symbol, "C"));
        company = _paymentSplitFactory.deployCompany(
            address(this),
            _asset,
            msg.sender,
            companyName,
            companySymbol
        );
        // new a sponsor, use "Sponsor" suffix for name and "SPO" for symbol
        string memory sponsorName = string(abi.encodePacked(name, " Sponsor"));
        string memory sponsorSymbol = string(abi.encodePacked(symbol, "S"));
        sponsor = _publicV4626Factory.deploySponsor(
            address(this),
            _asset,
            msg.sender,
            0,
            company,
            sponsorName,
            sponsorSymbol
        );
        // update data
        isCreator[msg.sender] = true;
        isCompany[company] = true;
        isSponsor[sponsor] = true;
        equityOf[company] = sponsor;
    }

    // called by sponsor
    function updateSponsorsOf(address creator) public {
        require(creator != address(0), "Invalid creator address");
        address sponsor = msg.sender;
        require(isSponsor[sponsor], "Invalid sponsor address");

        // Ensure the sponsor is not added repeatedly
        for (uint256 i = 0; i < sponsorsOf[creator].length; i++) {
            require(sponsorsOf[creator][i] != sponsor, "Sponsor already added");
        }

        sponsorsOf[creator].push(sponsor);
        emit SponsorUpdated(creator, sponsor, true);
    }

    // called by sponsor
    function deleteSponsorsOf(address creator) public {
        require(creator != address(0), "Invalid creator address");
        address sponsor = msg.sender;
        require(isSponsor[sponsor], "Invalid sponsor address");

        // find sponsor and delete sponsor
        for (uint256 i = 0; i < sponsorsOf[creator].length; i++) {
            if (sponsorsOf[creator][i] == sponsor) {
                // delete sponsor
                sponsorsOf[creator][i] = sponsorsOf[creator][
                    sponsorsOf[creator].length - 1
                ];
                sponsorsOf[creator].pop();

                emit SponsorUpdated(creator, sponsor, false);
                return;
            }
        }
    }

    // called by company
    function updateCompaniesOf(address creator) public {
        require(creator != address(0), "Invalid creator address");
        address company = msg.sender;
        require(isCompany[company], "Invalid sponsor address");

        // Ensure the company is not added repeatedly
        for (uint256 i = 0; i < companiesOf[creator].length; i++) {
            require(
                companiesOf[creator][i] != company,
                "Company already added"
            );
        }

        companiesOf[creator].push(company);
        emit CompanyUpdated(creator, company, true);
    }

    // called by company
    function deleteCompaniesOf(address creator) public {
        require(creator != address(0), "Invalid creator address");
        address company = msg.sender;
        require(isCompany[company], "Invalid sponsor address");

        // find company and delete company
        for (uint256 i = 0; i < companiesOf[creator].length; i++) {
            if (companiesOf[creator][i] == company) {
                // delete company
                companiesOf[creator][i] = companiesOf[creator][
                    companiesOf[creator].length - 1
                ];
                companiesOf[creator].pop();

                emit CompanyUpdated(creator, company, false);
                return;
            }
        }
    }

    // view
    function getSponsorsOf(
        address creator
    ) public view returns (address[] memory) {
        return sponsorsOf[creator];
    }

    function getCompaniesOf(
        address creator
    ) public view returns (address[] memory) {
        return companiesOf[creator];
    }
}
