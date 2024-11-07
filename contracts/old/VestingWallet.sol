// SPDX-License-Identifier: MIT
// @author Axolotl
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract VestingWallet is Context, Ownable {
    // token address
    address public token;
    // totalSps
    uint256 public totalSps;
    // waitingSps
    int256 public waitingSps;
    // minimum acceptable Salary
    uint256 public minWaitingSps;
    // totalReleased
    uint256 public totalReleased;
    // totalAccumulatedSalary
    uint256 public oldTotalAccumulatedSalary;
    // time of update totalAccumulatedSalary
    uint256 public lastReleaseAt;
    // wait time before increase or reduce salary
    uint256 public waitingTime = 30 days;
    // salary per seconds
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

    constructor(
        address owner_,
        uint256 amount,
        address _token
    ) payable Ownable(owner_) {
        uint256 sps = salaryToSps(amount);
        salaryDataOf[owner_].currentSps = sps;
        salaryDataOf[owner_].lastReleaseAt = block.timestamp;
        lastReleaseAt = block.timestamp;
        totalSps = sps;
        updateDataOf[owner_].waitUpdate = false;
        updateDataOf[owner_].expectedSps = sps;
        token = _token;
    }

    receive() external payable virtual {}

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

    function release(address creator_) public {
        updateOldTotalAccumulatedSalary();

        uint amount = releasable(creator_);
        salaryDataOf[creator_].lastReleaseAt = block.timestamp;
        totalReleased += amount;
        SafeERC20.safeTransfer(IERC20(token), creator_, amount);
    }

    // Schedule salary update
    function updateSalary(address creator_, uint256 amount) public onlyOwner {
        require(!updateDataOf[creator_].waitUpdate, "salary is waiting update");
        uint256 salary = salaryToSps(amount);
        // int256 overflow
        waitingSps =
            waitingSps +
            int256(salary) -
            int256(salaryDataOf[creator_].currentSps);

        _validateUpdateSalary();

        updateDataOf[creator_].waitUpdate = true;
        updateDataOf[creator_].updateTime = block.timestamp + waitingTime;
        updateDataOf[creator_].expectedSps = salary;
    }

    function _validateUpdateSalary() internal view {
        require(
            waitingSps <= int256(totalSps) / 10 ||
                waitingSps <= int256(minWaitingSps),
            "salary is too high"
        );
        //
    }

    function increaseRegisteredCapital(uint256 amount) external onlyOwner {
        SafeERC20.safeTransferFrom(
            IERC20(token),
            msg.sender,
            address(this),
            amount
        );
        uint256 sps = salaryToSps(amount);
        minWaitingSps += sps;
    }

    function decreaseRegisteredCapital(uint256 amount) external onlyOwner {
        SafeERC20.safeTransfer(IERC20(token), msg.sender, amount);
        uint256 sps = salaryToSps(amount);
        minWaitingSps -= sps;
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
        // update salary
        totalSps =
            totalSps -
            salaryDataOf[creator_].currentSps +
            updateDataOf[creator_].expectedSps;
        waitingSps =
            waitingSps +
            int256(updateDataOf[creator_].expectedSps) -
            int256(salaryDataOf[creator_].currentSps);
        salaryDataOf[creator_].currentSps = updateDataOf[creator_].expectedSps;
        delete updateDataOf[creator_];
    }

    // update Total Accumulated Salary
    function updateOldTotalAccumulatedSalary() public {
        oldTotalAccumulatedSalary +=
            totalSps *
            (block.timestamp - lastReleaseAt);
        lastReleaseAt = block.timestamp;
    }
}
