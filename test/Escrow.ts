import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Escrow, PlatformToken, Lender, Borrower } from "../typechain-types";

describe("Escrow", function () {
    async function deployEscrowFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();
        const EscrowFactory = await ethers.getContractFactory("Escrow");
        const escrow = (await EscrowFactory.deploy(500)) as Escrow; // 5% interest rate
        await escrow.waitForDeployment();

        const platformTokenAddress = await escrow.token();
        const lenderAddress = await escrow.lenderContract();
        const borrowerAddress = await escrow.borrowerContract();

        const platformToken = (await ethers.getContractAt("PlatformToken", platformTokenAddress)) as PlatformToken;
        const lender = (await ethers.getContractAt("Lender", lenderAddress)) as Lender;
        const borrower = (await ethers.getContractAt("Borrower", borrowerAddress)) as Borrower;

        return { escrow, platformToken, lender, borrower, owner, addr1, addr2 };
    }

    it("Should mint and transfer PlatformTokens", async function () {
        const { escrow, platformToken, owner, addr1 } = await loadFixture(deployEscrowFixture);
        const initialBalance = await platformToken.balanceOf(owner.address);
        console.log("Initial Balance:", ethers.formatEther(initialBalance)); // Debug statement

        await escrow.getTokens(ethers.parseEther("100"));
        const finalBalance = await platformToken.balanceOf(owner.address);
        console.log("Final Balance:", ethers.formatEther(finalBalance)); // Debug statement

        expect(finalBalance).to.equal(initialBalance + (ethers.parseEther("100")));
    });

    it("Should deposit and withdraw funds with interest", async function () {
        const { escrow, lender, owner } = await loadFixture(deployEscrowFixture);

        console.log("Owner balance before deposit:", ethers.formatEther(await owner.provider.getBalance(owner.address))); // Debug statement

        await escrow.connect(owner).deposit({ value: ethers.parseEther("1") });
        console.log("Deposit made"); // Debug statement

        const lenderInfo = await lender.lenders(owner.address);
        console.log("Lender info after deposit:", lenderInfo.amount.toString()); // Debug statement

        await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]); // Fast forward one year
        await ethers.provider.send("evm_mine", []); // Force a block to be mined

        const interest = await lender.interestGained(owner.address);
        console.log("Interest gained:", ethers.formatEther(interest)); // Debug statement

        escrow.connect(owner).withdraw();
        console.log("Withdrawal made"); // Debug statement

        const balance = await owner.provider.getBalance(owner.address);
        console.log("Owner balance after withdrawal:", ethers.formatEther(balance)); // Debug statement

        expect(balance).to.be.gt(ethers.parseEther("999"));
    });

    it("Should allow staking of tokens for borrowers", async function () {
        const { escrow, platformToken, owner, borrower } = await loadFixture(deployEscrowFixture);
        await escrow.getTokens(ethers.parseEther("100"));
        await platformToken.connect(owner).approve(escrow.getAddress(), ethers.parseEther("100"));
        await escrow.connect(owner).stakeTokens(ethers.parseEther("100"));
        const borrowerInfo = await borrower.borrowers(owner.address);
        expect(borrowerInfo.stackedTokens).to.equal(ethers.parseEther("100"));
    });

    // it("Should allow borrowing and repayment of funds", async function () {
    //     const { escrow, platformToken, owner, borrower } = await loadFixture(deployEscrowFixture);
    //     await escrow.connect(owner).getTokens(ethers.parseEther("100"));
    //     await platformToken.connect(owner).approve(await escrow.getAddress(), ethers.parseEther("100"));
    //     await escrow.connect(owner).stakeTokens(ethers.parseEther("100"));

    //     const borrowerInfoBefore = await borrower.borrowers(owner.address);
    //     console.log("Borrower info before borrowing:", borrowerInfoBefore); // Debug statement

    //     await escrow.connect(owner).borrow(1, 1000000000); // 30 days loan
    //     expect(await owner.provider.getBalance(owner.address)).to.be.gt(ethers.parseEther("10000"));

    //     await ethers.provider.send("evm_increaseTime", [15 * 24 * 60 * 60]); // Fast forward 15 days
    //     await ethers.provider.send("evm_mine", []); // Force a block to be mined
    //     const repaymentAmount = (await borrower.borrowers(owner.address)).repaymentAmount;
    //     await escrow.connect(owner).repay({ value: repaymentAmount }); // Repay with exact amount

    //     const borrowerInfo = await borrower.borrowers(owner.address);
    //     expect(borrowerInfo.repaymentAmount).to.equal(0);
    //     expect(await platformToken.balanceOf(owner.address)).to.equal(ethers.parseEther("100"));
    // });

    // it("Should claim collateral if loan duration is exceeded", async function () {
    //     const { escrow, owner, borrower, platformToken } = await loadFixture(deployEscrowFixture);
    //     await escrow.connect(owner).getTokens(ethers.parseEther("100"));
    //     await platformToken.connect(owner).approve(await escrow.getAddress(), ethers.parseEther("100"));
    //     await escrow.connect(owner).stakeTokens(ethers.parseEther("100"));

    //     const borrowerInfoBefore = await borrower.borrowers(owner.address);
    //     console.log("Borrower info before borrowing:", borrowerInfoBefore); // Debug statement

    //     await escrow.connect(owner).borrow(1, 1000000000); // 30 days loan
    //     console.log("Borrower info before borrowing:", borrowerInfoBefore); // Debug statement
    //     await ethers.provider.send("evm_increaseTime", [60 * 24 * 60 * 60]); // Fast forward 60 days
    //     await ethers.provider.send("evm_mine", []); // Force a block to be mined
    //     await escrow.connect(owner).claimCollateral(owner.address);

    //     const borrowerInfo = await borrower.borrowers(owner.address);
    //     expect(borrowerInfo.stackedTokens).to.equal(0);
    // });
});
