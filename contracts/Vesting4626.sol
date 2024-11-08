// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";

import {V4626Router} from "./V4626Router.sol";

contract Vesting4626 is Context, Ownable, ERC4626 {
    V4626Router _router;
    // Company of this contract
    address _company;
    // total salary per second
    uint256 public totalSps;
    // pending changes in salary per second
    int256 public pendingSps;
    // minimum acceptable Salary
    uint256 public minPendingSps;
    // total released funds
    uint256 public totalReleased;
    // total accumulated salary over time
    uint256 public oldTotalAccumulatedSalary;
    // last timestamp of total accumulated salary update
    uint256 public lastReleaseAt;
    // waiting time before salary adjustment
    uint256 public waitingTime = 30 days;

    struct SalaryData {
        uint256 currentSps;
        uint256 lastReleaseAt;
    }
    mapping(address => SalaryData) public salaryDataOf;

    // update salary data
    struct UpdateData {
        bool waitUpdate;
        uint256 expectedSps;
        uint256 updateTime;
    }
    mapping(address => UpdateData) public updateDataOf;

    // Events
    event SalaryReleased(address indexed creator, uint256 amount);
    event SalaryUpdateScheduled(
        address indexed creator,
        uint256 updateTime,
        uint256 currentAmount,
        uint256 pendingAmount
    );
    event SalaryUpdateFinished(
        address indexed creator,
        uint256 amount,
        uint256 timestamp,
        uint256 totalAccumulatedSalary,
        uint256 totalSalary
    );
    event CapitalIncreased(uint256 amount);
    event CapitalDecreased(uint256 amount);
    event ClaimProcessed(address company, uint256 payment);
    event AllClaimsProcessed(address[] companies, uint256 totalPayment);

    constructor(
        address router_,
        address owner_,
        uint256 amount,
        IERC20 token_,
        address company_,
        string memory name,
        string memory symbol
    ) Ownable(owner_) ERC4626(token_) ERC20(name, symbol) {
        _router = V4626Router(router_);
        _company = company_;
        uint256 sps = salaryToSps(amount);
        salaryDataOf[owner_].currentSps = sps;
        salaryDataOf[owner_].lastReleaseAt = block.timestamp;
        lastReleaseAt = block.timestamp;
        totalSps = sps;
        updateDataOf[owner_].waitUpdate = false;
        updateDataOf[owner_].expectedSps = sps;
        // owner shares
        _mint(owner_, 10 ** (_decimalsOffset() + 4));
    }

    function _decimalsOffset() internal pure override returns (uint8) {
        return 12;
    }

    function releasable(
        address creator_
    ) public view virtual returns (uint256) {
        return
            salaryDataOf[creator_].currentSps *
            (block.timestamp - salaryDataOf[creator_].lastReleaseAt);
    }

    // The total historically accumulated salary within the protocol
    function totalAccumulatedSalary() public view returns (uint256) {
        return
            oldTotalAccumulatedSalary +
            totalSps *
            (block.timestamp - lastReleaseAt);
    }

    // Total pending salary amount within the protocol
    function totalPendingSalary() public view returns (uint256) {
        return totalAccumulatedSalary() - totalReleased;
    }

    // Convert monthly salary to per-second salary
    function salaryToSps(uint256 salary) public pure returns (uint256) {
        return salary / 30 days;
    }

    // Convert per-second salary to monthly salary
    function spsToSalary(uint256 sps) public pure returns (uint256) {
        return sps * 30 days;
    }

    /** @dev See {IERC4626-totalAssets}. */
    function totalAssets() public view virtual override returns (uint256) {
        if (IERC20(asset()).balanceOf(address(this)) >= totalPendingSalary()) {
            return
                IERC20(asset()).balanceOf(address(this)) - totalPendingSalary();
        }
        return 0;
    }

    function release(address creator_) public returns (uint256 amount) {
        updateOldTotalAccumulatedSalary();

        amount = releasable(creator_);
        salaryDataOf[creator_].lastReleaseAt = block.timestamp;
        totalReleased += amount;
        SafeERC20.safeTransfer(IERC20(asset()), creator_, amount);
        emit SalaryReleased(creator_, amount);
        return amount;
    }

    // Schedule salary update
    function updateSalary(address creator_, uint256 amount) public onlyOwner {
        require(!updateDataOf[creator_].waitUpdate, "salary is waiting update");
        uint256 salary = salaryToSps(amount);
        require(
            salary != salaryDataOf[creator_].currentSps,
            "salary is equal to old one"
        );

        require(
            salary <= uint256(type(int256).max),
            "Value exceeds int256 max range"
        );
        pendingSps =
            pendingSps +
            int256(salary) -
            int256(salaryDataOf[creator_].currentSps);

        _validateUpdateSalary();

        updateDataOf[creator_].waitUpdate = true;
        updateDataOf[creator_].updateTime = block.timestamp + waitingTime;
        updateDataOf[creator_].expectedSps = salary;

        emit SalaryUpdateScheduled(
            creator_,
            updateDataOf[creator_].updateTime,
            spsToSalary(salaryDataOf[creator_].currentSps),
            amount
        );
    }

    function _validateUpdateSalary() internal view {
        require(
            pendingSps <= int256(totalSps) / 10 ||
                pendingSps <= int256(minPendingSps),
            "salary is too high"
        );
        //
    }

    function increaseRegisteredCapital(uint256 amount) external onlyOwner {
        SafeERC20.safeTransferFrom(
            IERC20(asset()),
            msg.sender,
            address(this),
            amount
        );
        uint256 sps = salaryToSps(amount);
        minPendingSps += sps;
        emit CapitalIncreased(amount);
    }

    function decreaseRegisteredCapital(uint256 amount) external onlyOwner {
        SafeERC20.safeTransfer(IERC20(asset()), msg.sender, amount);
        uint256 sps = salaryToSps(amount);
        minPendingSps -= sps;
        emit CapitalDecreased(amount);
    }

    // The salary will be officially updated after the waiting period expires
    function finishUpdate(address creator_) public {
        require(updateDataOf[creator_].waitUpdate, "nothing need update");
        require(
            updateDataOf[creator_].updateTime <= block.timestamp,
            "Not time for update yet"
        );
        // release salary
        release(creator_);
        // update router data
        if (salaryDataOf[creator_].currentSps == 0) {
            _router.updateSponsorsOf(creator_);
        }

        if (updateDataOf[creator_].expectedSps == 0) {
            _router.deleteSponsorsOf(creator_);
        }
        // update salary
        totalSps =
            totalSps -
            salaryDataOf[creator_].currentSps +
            updateDataOf[creator_].expectedSps;
        pendingSps =
            pendingSps +
            int256(updateDataOf[creator_].expectedSps) -
            int256(salaryDataOf[creator_].currentSps);
        salaryDataOf[creator_].currentSps = updateDataOf[creator_].expectedSps;
        delete updateDataOf[creator_];

        emit SalaryUpdateFinished(
            creator_,
            spsToSalary(salaryDataOf[creator_].currentSps),
            block.timestamp,
            totalAccumulatedSalary(),
            spsToSalary(totalSps)
        );
    }

    // update Total Accumulated Salary
    function updateOldTotalAccumulatedSalary() public {
        oldTotalAccumulatedSalary +=
            totalSps *
            (block.timestamp - lastReleaseAt);
        lastReleaseAt = block.timestamp;
    }

    // call claim function in contract paymentSplit
    function callClaim() public {
        (bool success, bytes memory data) = _company.call(
            abi.encodeWithSignature("claim(address)", address(this))
        );
        if (success) {
            uint256 payment = abi.decode(data, (uint256));
            emit ClaimProcessed(_company, payment);
        }
    }

    // call all claim function in contract paymentSplit
    function callAllClaim() public {
        // read companies from router，and then call claim function of companies
        address[] memory companies = _router.getCompaniesOf(address(this));
        uint256 totalPayment = 0;
        for (uint256 i = 0; i < companies.length; i++) {
            (bool success, bytes memory data) = companies[i].call(
                abi.encodeWithSignature("claim(address)", address(this))
            );

            if (success) {
                uint256 payment = abi.decode(data, (uint256));
                totalPayment += payment;
            }
        }
        emit AllClaimsProcessed(companies, totalPayment);
    }
}
