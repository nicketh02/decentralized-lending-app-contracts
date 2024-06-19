import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DEFAULT_INTEREST_RATE = 500;
const ONE_ETH: bigint = 1_000_000_000_000_000n;

const EscrowModule = buildModule("EscrowModule", (m) => {
    const interestRate = m.getParameter("interestRate", DEFAULT_INTEREST_RATE);
    const lockedAmount = m.getParameter("lockedAmount", ONE_ETH);


    const escrow = m.contract("Escrow", [interestRate], {
        value: lockedAmount,
    });

    return { escrow };
});

export default EscrowModule;