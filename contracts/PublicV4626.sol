// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Vesting4626} from "./Vesting4626.sol";

contract PublicV4626 is Vesting4626 {
    // whether this contract is publicly listed
    bool public isPublic = false;

    // lastTotalSupply
    uint256 public lastUpdated; // update time of last day
    uint256 public lastTotalShares; // totalShares value of last day
    uint256 public constant TIME_INTERVAL = 1 days; // update every day
    uint256 public allowedDeviation = 11000; // 10%

    // Events
    event TurnPublicAt(uint256 timestamp);

    modifier onlyPublic() {
        require(isPublic, "not public");
        _;
    }

    constructor(
        address router_,
        address owner_,
        uint256 amount,
        IERC20 _token,
        address company,
        string memory name,
        string memory symbol
    ) Vesting4626(router_, owner_, amount, _token, company, name, symbol) {
        lastUpdated = block.timestamp;
        lastTotalShares = totalSupply();
    }

    // List this contract publicly, and it cannot be reversed.
    function turnPublic() public onlyOwner {
        isPublic = true;
        emit TurnPublicAt(block.timestamp);
    }

    function _checkTotalShares(uint256 newTotalShares) internal view {
        uint256 minAllowedShares = Math.mulDiv(
            lastTotalShares,
            10000,
            allowedDeviation
        );
        uint256 maxAllowedShares = Math.mulDiv(
            lastTotalShares,
            allowedDeviation,
            10000
        );
        require(
            newTotalShares >= minAllowedShares &&
                newTotalShares <= maxAllowedShares,
            "TotalShares deviation exceeds 10%"
        );
    }

    /** @dev See {IERC4626-maxDeposit}. */
    function maxDeposit(
        address
    ) public view virtual override returns (uint256) {
        return
            _convertToAssets(
                Math.mulDiv(lastTotalShares, allowedDeviation, 10000) -
                    totalSupply(),
                Math.Rounding.Floor
            );
    }

    /** @dev See {IERC4626-maxMint}. */
    function maxMint(address) public view virtual override returns (uint256) {
        return
            Math.mulDiv(lastTotalShares, allowedDeviation, 10000) -
            totalSupply();
    }

    /** @dev See {IERC4626-maxWithdraw}. */
    function maxWithdraw(
        address owner
    ) public view virtual override returns (uint256) {
        uint256 minAllowedSupply = Math.mulDiv(
            lastTotalShares,
            10000,
            allowedDeviation
        );
        if (totalSupply() - minAllowedSupply > balanceOf(owner)) {
            return _convertToAssets(balanceOf(owner), Math.Rounding.Floor);
        } else {
            return
                _convertToAssets(
                    totalSupply() - minAllowedSupply,
                    Math.Rounding.Floor
                );
        }
    }

    /** @dev See {IERC4626-maxRedeem}. */
    function maxRedeem(
        address owner
    ) public view virtual override returns (uint256) {
        uint256 minAllowedSupply = Math.mulDiv(
            lastTotalShares,
            10000,
            allowedDeviation
        );
        if (totalSupply() - minAllowedSupply > balanceOf(owner)) {
            return balanceOf(owner);
        } else {
            return totalSupply() - minAllowedSupply;
        }
    }

    function _updateTotalShares() internal {
        if (block.timestamp >= lastUpdated + TIME_INTERVAL) {
            lastTotalShares = totalSupply();
            lastUpdated = block.timestamp;
        }
    }

    function deposit(
        uint256 assets,
        address receiver
    ) public override returns (uint256) {
        callClaim(); // callClaim
        return super.deposit(assets, receiver);
    }

    function mint(
        uint256 shares,
        address receiver
    ) public override returns (uint256) {
        callClaim(); // callClaim
        return super.mint(shares, receiver);
    }

    function withdraw(
        uint256 assets,
        address receiver,
        address owner
    ) public override returns (uint256) {
        callClaim(); // callClaim
        return super.withdraw(assets, receiver, owner);
    }

    function redeem(
        uint256 shares,
        address receiver,
        address owner
    ) public override returns (uint256) {
        callClaim(); // callClaim
        return super.redeem(shares, receiver, owner);
    }

    function _deposit(
        address caller,
        address receiver,
        uint256 assets,
        uint256 shares
    ) internal virtual override onlyPublic {
        _checkTotalShares(totalSupply() + shares); // checkTotalShares
        _updateTotalShares(); // update lastTotalShares
        super._deposit(caller, receiver, assets, shares);
        emit TotalAssetsAndSupplyUpdated(
            block.timestamp,
            totalAssets(),
            totalSupply()
        );
    }

    function _withdraw(
        address caller,
        address receiver,
        address owner,
        uint256 assets,
        uint256 shares
    ) internal virtual override onlyPublic {
        _checkTotalShares(totalSupply() - shares); // checkTotalShares
        _updateTotalShares(); // update lastTotalShares
        super._withdraw(caller, receiver, owner, assets, shares);
        emit TotalAssetsAndSupplyUpdated(
            block.timestamp,
            totalAssets(),
            totalSupply()
        );
    }
}
