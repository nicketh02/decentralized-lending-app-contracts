// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Lender} from "./Lender.sol";
import {Borrower} from "./Borrower.sol";
import {PlatformToken} from "./PlatformToken.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Escrow is Ownable {
    Lender public lenderContract;
    Borrower public borrowerContract;
    PlatformToken public token;

    constructor(uint256 _interestrate) payable Ownable(msg.sender) {
        token = new PlatformToken();
        lenderContract = new Lender(_interestrate);
        borrowerContract = new Borrower(500);
    }

    function getTokens(uint256 _amount) public {
        token.mint(msg.sender, _amount);
    }

    function changeInterestRate(uint256 _interestRate) external onlyOwner {
        lenderContract.setInterestRate(_interestRate);
    }

    function deposit() public payable {
        lenderContract.deposit(msg.value, msg.sender);
    }

    function withdraw() external {
        uint256 totalAmount = lenderContract.withdraw(msg.sender);
        payable(msg.sender).transfer(totalAmount);
    }

    function stakeTokens(uint256 _amount) external {
        borrowerContract.stakeTokens(_amount, msg.sender);
        token.transferFrom(msg.sender, address(this), _amount);
    }

    function borrow(uint256 _amount, uint256 _loanDuration) external {
        borrowerContract.borrow(_amount, _loanDuration, msg.sender);
        payable(msg.sender).transfer(_amount);
    }

    function repay() external payable {
        (bool repaid, uint256 refund) = borrowerContract.repay(
            msg.value,
            msg.sender
        );
        if (repaid) {
            token.transfer(msg.sender, borrowerContract.collateralAmount());
        }
        if (refund != 0) {
            payable(msg.sender).transfer(refund);
        }
    }

    function claimCollateral(address _borrowerAddress) external {
        borrowerContract.claimCollateral(_borrowerAddress);
    }

    receive() external payable {
        deposit();
    }
}
