// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Borrower is Ownable {
    uint256 public constant collateralAmount = 100; // Fixed amount of collateral

    uint256 public interestRate;

    struct BorrowerInfo {
        uint256 stackedTokens;
        uint256 loanAmount;
        uint256 repaymentAmount;
        uint256 borrowTime;
        uint256 loanDuration;
    }

    mapping(address => BorrowerInfo) public borrowers;

    constructor(uint256 _interestRate) Ownable(msg.sender) {
        interestRate = _interestRate;
    }

    function stakeTokens(
        uint256 _stackedTokens,
        address _borrowerAddress
    ) external onlyOwner {
        borrowers[_borrowerAddress].stackedTokens += _stackedTokens;
    }

    function resetStackedTokens(address _borrowerAddress) external onlyOwner {
        borrowers[_borrowerAddress].stackedTokens = 0;
    }

    function borrow(
        uint256 _amount,
        uint256 _loanDuration,
        address _borrowerAddress
    ) external onlyOwner {
        BorrowerInfo storage borrowerInfo = borrowers[_borrowerAddress];
        require(
            borrowerInfo.stackedTokens >= collateralAmount,
            "Not enough staked tokens"
        );
        require(borrowerInfo.repaymentAmount == 0, "Plz repay previous loan");
        borrowerInfo.borrowTime = block.timestamp;
        borrowerInfo.loanDuration = _loanDuration;
        borrowerInfo.loanAmount = _amount;
        borrowerInfo.repaymentAmount =
            _amount +
            ((_amount * interestRate * _loanDuration) / (365 days * 10000));
    }

    function repay(
        uint256 _amount,
        address _borrowerAddress
    ) external onlyOwner returns (uint256) {
        require(_amount > 0, "Repayment amount must be greater than zero");
        BorrowerInfo storage borrower = borrowers[_borrowerAddress];
        uint256 borrowDuration = block.timestamp - borrower.borrowTime;
        require(
            borrowDuration <= borrower.loanDuration,
            "Loan duration exceeded"
        );
        uint256 refund = 0;
        if (_amount < borrower.repaymentAmount) {
            borrower.repaymentAmount -= _amount;
            return refund;
        } else {
            refund = _amount - borrower.repaymentAmount;
            borrower.repaymentAmount = 0;
            borrower.borrowTime = 0;
            borrower.loanDuration = 0;
            borrower.loanAmount = 0;
            return refund;
        }
    }

    function claimCollateral(address _borrowerAddress) external onlyOwner {
        BorrowerInfo storage borrower = borrowers[_borrowerAddress];
        require(borrower.stackedTokens > 0, "No collateral to claim");
        uint256 borrowDuration = block.timestamp - borrower.borrowTime;
        require(
            borrowDuration > borrower.loanDuration,
            "Loan duration not exceeded"
        );
        borrower.stackedTokens = 0;
        borrower.repaymentAmount = 0;
        borrower.borrowTime = 0;
        borrower.loanDuration = 0;
        borrower.loanAmount = 0;
    }
}
