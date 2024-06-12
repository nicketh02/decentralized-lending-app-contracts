import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Lender } from "../typechain-types";

describe("Lender", function () {
    async function deployLenderFixture() {
        const [owner, addr1] = await ethers.getSigners();
        const LenderFactory = await ethers.getContractFactory("Lender");
        const lender = (await LenderFactory.deploy(500)) as Lender; // 5% interest rate
        await lender.waitForDeployment();
        return { lender, owner, addr1 };
    }

    it("Should set initial interest rate", async function () {
        const { lender } = await loadFixture(deployLenderFixture);
        expect(await lender.interestRate()).to.equal(500);
    });

    it("Should allow owner to set interest rate", async function () {
        const { lender } = await loadFixture(deployLenderFixture);
        await lender.setInterestRate(1000);
        expect(await lender.interestRate()).to.equal(1000);
    });

    it("Should allow owner to deposit funds", async function () {
        const { lender, owner } = await loadFixture(deployLenderFixture);
        await lender.deposit(ethers.parseEther("1"), owner.address);
        const lenderInfo = await lender.lenders(owner.address);
        expect(lenderInfo.amount).to.equal(ethers.parseEther("1"));
    });

    it("Should calculate interest correctly", async function () {
        const { lender, owner } = await loadFixture(deployLenderFixture);
        await lender.deposit(ethers.parseEther("1"), owner.address);
        await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]); // Fast forward one year
        await ethers.provider.send("evm_mine", []); // Force a block to be mined
        const interest = await lender.interestGained(owner.address);
        expect(interest).to.equal(ethers.parseEther("0.05"));
    });

    it("Should allow owner to withdraw funds with interest", async function () {
        const { lender, owner } = await loadFixture(deployLenderFixture);
        await lender.deposit(ethers.parseEther("1"), owner.address);
        await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]); // Fast forward one year
        await ethers.provider.send("evm_mine", []); // Force a block to be mined
        await lender.withdraw(owner.address);

        // Check the lender's balance after withdrawal
        const lenderInfoAfterWithdrawal = await lender.lenders(owner.address);
        expect(lenderInfoAfterWithdrawal.amount).to.equal(0);
    });
});
