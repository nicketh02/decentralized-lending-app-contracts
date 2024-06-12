// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Lender is Ownable {
    uint256 public interestRate; // Annual interest rate in basis points (10000 = 100%)

    struct LenderInfo {
        uint256 amount;
        uint256 depositTime;
        uint256 interestGainedTillLastUpdate;
    }

    mapping(address => LenderInfo) public lenders;

    constructor(uint256 _interestRate) Ownable(msg.sender) {
        interestRate = _interestRate;
    }

    function setInterestRate(uint256 _rate) external onlyOwner {
        interestRate = _rate;
    }

    function deposit(
        uint256 _amount,
        address _lenderAddress
    ) external onlyOwner {
        require(_amount > 0, "Deposit amount must be greater than zero");
        LenderInfo storage lender = lenders[_lenderAddress];
        if (lender.amount == 0) {
            lender.amount = _amount;
            lender.depositTime = block.timestamp;
        } else {
            lender.interestGainedTillLastUpdate = totalInterestGained(
                _lenderAddress
            );
            lender.amount += _amount;
            lender.depositTime = block.timestamp;
        }
    }

    function withdraw(
        address _lenderAddress
    ) external onlyOwner returns (uint256) {
        LenderInfo storage lender = lenders[_lenderAddress];
        require(lender.amount > 0, "No funds to withdraw");
        uint256 totalAmount = lender.amount +
            totalInterestGained(_lenderAddress);
        lender.amount = 0;
        lender.interestGainedTillLastUpdate = 0;
        return totalAmount;
    }

    function interestGainedAfterUpdate(
        address _lenderAddress
    ) internal view returns (uint256) {
        LenderInfo storage lender = lenders[_lenderAddress];
        return
            (lender.amount *
                interestRate *
                (block.timestamp - lender.depositTime)) / (365 days * 10000);
    }

    function totalInterestGained(
        address _lenderAddress
    ) public view returns (uint256) {
        LenderInfo storage lender = lenders[_lenderAddress];
        return
            lender.interestGainedTillLastUpdate +
            interestGainedAfterUpdate(_lenderAddress);
    }
}
