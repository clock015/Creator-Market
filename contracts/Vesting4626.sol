// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

import {ICreatorMarketRouter} from "./interfaces/ICreatorMarketRouter.sol";

contract Vesting4626 is Context, Ownable, ERC4626 {
    ICreatorMarketRouter _router;
    // Company of this contract
    address private _company;
    // total salary per second
    uint256 public totalSps;
    // pending changes in salary per second
    int256 public pendingSps;
    // minimum acceptable Salary
    uint256 public minPendingSps;
    // total released funds
    uint256 private totalReleased;
    // total accumulated salary over time
    uint256 private oldTotalAccumulatedSalary;
    // last timestamp of total accumulated salary update
    uint256 private lastReleaseAt;
    // waiting time before salary adjustment
    // it should be 30 days, but now adjustment it to 1 days for testing
    uint256 private constant waitingTime = 1 days;

    struct SalaryData {
        uint256 currentSps;
        uint256 lastReleaseAt;
    }
    mapping(address => SalaryData) public salaryDataOf;

    // update salary data
    struct UpdateData {
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
        uint256 timestamp
    );
    event CapitalIncreased(uint256 amount);

    event TotalAssetsAndSupplyUpdated(
        uint256 time,
        uint256 totalAssets,
        uint256 totalSupply
    );

    constructor(
        address router_,
        address owner_,
        uint256 amount,
        IERC20 token_,
        address company_,
        string memory name,
        string memory symbol
    ) Ownable(owner_) ERC4626(token_) ERC20(name, symbol) {
        _router = ICreatorMarketRouter(router_);
        _company = company_;
        uint256 sps = salaryToSps(amount);
        salaryDataOf[owner_].currentSps = sps;
        salaryDataOf[owner_].lastReleaseAt = block.timestamp;
        lastReleaseAt = block.timestamp;
        totalSps = sps;
        updateDataOf[owner_].expectedSps = sps;
        // owner shares
        _mint(owner_, 10 ** decimals());

        emit TotalAssetsAndSupplyUpdated(
            block.timestamp,
            totalAssets(),
            totalSupply()
        );
    }

    function _decimalsOffset() internal pure override returns (uint8) {
        return 8;
    }

    function releasable(
        address creator_
    ) public view virtual returns (uint256) {
        uint256 timeElapsed = block.timestamp -
            salaryDataOf[creator_].lastReleaseAt;
        return Math.mulDiv(salaryDataOf[creator_].currentSps, timeElapsed, 1);
    }

    // The total historically accumulated salary within the protocol
    function totalAccumulatedSalary() public view returns (uint256) {
        uint256 timeElapsed = block.timestamp - lastReleaseAt;
        return
            oldTotalAccumulatedSalary + Math.mulDiv(totalSps, timeElapsed, 1);
    }

    // Total pending salary amount within the protocol
    function totalPendingSalary() public view returns (uint256) {
        return totalAccumulatedSalary() - totalReleased;
    }

    // Convert monthly salary to per-second salary
    function salaryToSps(uint256 salary) public pure returns (uint256) {
        return Math.mulDiv(salary, 1, 30 days);
    }

    // Convert per-second salary to monthly salary
    function spsToSalary(uint256 sps) public pure returns (uint256) {
        return Math.mulDiv(sps, 30 days, 1);
    }

    /** @dev See {IERC4626-totalAssets}. */
    function totalAssets() public view virtual override returns (uint256) {
        uint256 balance = IERC20(asset()).balanceOf(address(this));
        uint256 pendingSalary = totalPendingSalary();
        uint256 claimableAmount = 0;
        (bool success, bytes memory data) = _company.staticcall(
            abi.encodeWithSignature("claimable(address)", address(this))
        );
        if (success) {
            claimableAmount = abi.decode(data, (uint256));
        }

        if (balance + claimableAmount >= pendingSalary) {
            return balance + claimableAmount - pendingSalary;
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
        emit TotalAssetsAndSupplyUpdated(
            block.timestamp,
            totalAssets(),
            totalSupply()
        );

        return amount;
    }

    // Schedule salary update
    function updateSalary(address creator_, uint256 amount) public onlyOwner {
        uint256 updateTime = updateDataOf[creator_].updateTime;
        uint256 salary = salaryToSps(amount);
        uint256 currentSps = salaryDataOf[creator_].currentSps;
        require(creator_ != _company, "can not release to company");
        require(updateTime == 0, "salary is waiting update");
        require(salary != currentSps, "salary is equal to old one");

        require(
            salary <= uint256(type(int256).max),
            "Value exceeds int256 max range"
        );

        int256 differenceSps = int256(salary) - int256(currentSps);
        int256 newPendingSps = pendingSps + differenceSps;
        uint256 limitSps = totalSps / 10;

        if (newPendingSps >= int256(limitSps)) {
            if (pendingSps >= int256(limitSps)) {
                require(
                    differenceSps <= int256(minPendingSps),
                    "salary is too high"
                );
                if (differenceSps > 0) {
                    minPendingSps -= uint256(differenceSps);
                }
            } else {
                uint256 difference = uint256(newPendingSps) - limitSps;
                // The owner's capital can be used to increase employee salaries, but it can only be used once
                require(difference <= minPendingSps, "salary is too high");
                minPendingSps -= difference;
            }
        }

        updateDataOf[creator_].updateTime = block.timestamp + waitingTime;
        updateDataOf[creator_].expectedSps = salary;

        emit SalaryUpdateScheduled(
            creator_,
            updateTime,
            spsToSalary(currentSps),
            amount
        );
    }

    // The owner's capital can be used to increase employee salaries, but it can only be used once
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
        emit TotalAssetsAndSupplyUpdated(
            block.timestamp,
            totalAssets(),
            totalSupply()
        );
    }

    // The salary will be officially updated after the waiting period expires
    function finishUpdate(address creator_) public {
        require(updateDataOf[creator_].updateTime != 0, "nothing need update");
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
            block.timestamp
        );

        emit TotalAssetsAndSupplyUpdated(
            block.timestamp,
            totalAssets(),
            totalSupply()
        );
    }

    // update Total Accumulated Salary
    function updateOldTotalAccumulatedSalary() public {
        uint256 timeElapsed = block.timestamp - lastReleaseAt;
        oldTotalAccumulatedSalary += Math.mulDiv(totalSps, timeElapsed, 1);
        lastReleaseAt = block.timestamp;
    }

    // call claim function in contract paymentSplit
    function callClaim() public {
        (bool success, ) = _company.call(
            abi.encodeWithSignature("claim(address)", address(this))
        );

        emit TotalAssetsAndSupplyUpdated(
            block.timestamp,
            totalAssets(),
            totalSupply()
        );
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

        emit TotalAssetsAndSupplyUpdated(
            block.timestamp,
            totalAssets(),
            totalSupply()
        );
    }
}
