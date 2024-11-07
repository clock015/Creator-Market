// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {V4626Router} from "./V4626Router.sol";

contract PaymentSplit is ERC20 {
    using Math for uint256;
    IERC20 public immutable _asset;
    V4626Router immutable _router;

    uint256 public totalReleased; // Total amount released to beneficiaries

    // Record the last height of the fund pool when each beneficiary claimed,height = totalReceived (when claimed)
    mapping(address => uint256) public height;

    // Event triggered when a beneficiary withdraws funds
    event ClaimExecuted(address indexed account, uint256 amount);
    event ReleaseCalled(address[] sponsors, uint256 amount);

    constructor(
        address router_,
        IERC20 asset_,
        address owner,
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) {
        _router = V4626Router(router_);
        _asset = asset_;
        _mint(owner, 1e18);
    }

    function transfer(
        address to,
        uint256 value
    ) public virtual override returns (bool) {
        // claim
        address owner = _msgSender();
        claim(owner);
        claim(to);
        uint256 toBalance = balanceOf(to);

        _transfer(owner, to, value);
        // transfer height data
        height[to] = height[owner];

        // update router account
        if (toBalance == 0) {
            _router.updateCompaniesOf(to);
        }

        if (balanceOf(owner) == 0) {
            _router.deleteCompaniesOf(owner);
        }
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public virtual override returns (bool) {
        // claim
        claim(from);
        claim(to);
        uint256 toBalance = balanceOf(to);

        address spender = _msgSender();
        _spendAllowance(from, spender, value);
        _transfer(from, to, value);
        // transfer height data
        height[to] = height[from];

        // update router account
        if (toBalance == 0) {
            _router.updateCompaniesOf(to);
        }

        if (balanceOf(from) == 0) {
            _router.deleteCompaniesOf(from);
        }
        return true;
    }

    // Beneficiary claims the allocated funds
    function claim(address _account) public virtual returns (uint256) {
        uint256 payment = 0;
        // Check if the beneficiary is valid
        if (balanceOf(_account) > 0) {
            // Calculate the amount the beneficiary is entitled to in ETH
            payment = claimable(_account);

            // Update the beneficiary's current height
            height[_account] = getTotalHeight();
            // Update the total released amount
            totalReleased += payment;
            // Transfer the funds
            SafeERC20.safeTransfer(_asset, _account, payment);
            // Emit event for the beneficiary's withdrawal
            emit ClaimExecuted(_account, payment);
        }

        return payment;
    }

    // Calculate the claimable amount for a specific account
    function claimable(address _account) public view returns (uint256) {
        // Calculate the total income of the contract, which is the accumulated total amount
        uint256 totalHeight = getTotalHeight();
        // Beneficiary's entitled amount = total entitled amount - amount already claimed
        return
            ((totalHeight - height[_account]) * balanceOf(_account)) /
            totalSupply();
    }

    function getTotalHeight() public view returns (uint256) {
        // Calculate the total income of the split contract, which is the accumulated total amount
        uint256 totalReceived = _asset.balanceOf(address(this)) + totalReleased;
        return totalReceived;
    }

    function callRelease() public {
        // Get sponsors from the router, then claim salary from each sponsor
        address[] memory sponsors = _router.getSponsorsOf(address(this));
        uint256 totalReceivedFromSponsors = 0;

        for (uint256 i = 0; i < sponsors.length; i++) {
            (bool success, bytes memory result) = sponsors[i].call(
                abi.encodeWithSignature("release(address)", address(this))
            );

            // Decode the return value from `release` function and accumulate
            if (success) {
                uint256 receivedAmount = abi.decode(result, (uint256));
                totalReceivedFromSponsors += receivedAmount;
            }
        }
        emit ReleaseCalled(sponsors, totalReceivedFromSponsors);
    }
}
