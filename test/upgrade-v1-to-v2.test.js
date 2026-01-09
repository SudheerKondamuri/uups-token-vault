import { expect } from "chai";
import pkg from "hardhat";
const { ethers, upgrades } = pkg;

describe("TokenVault V2 Upgrade", function () {
  let vaultV1, vaultV2, token, admin, user;
  const FEE = 500; // 5%
  const YIELD_RATE = 1000; // 10%

  beforeEach(async function () {
    [admin, user] = await ethers.getSigners();
    const MockToken = await ethers.getContractFactory("MockERC20");
    token = await MockToken.deploy();

    const TokenVaultV1 = await ethers.getContractFactory("TokenVaultV1");
    vaultV1 = await upgrades.deployProxy(TokenVaultV1, [await token.getAddress(), admin.address, FEE], { kind: 'uups' });

    // Initial state in V1
    const amount = ethers.parseUnits("100", 18);
    await token.mint(user.address, amount);
    await token.connect(user).approve(await vaultV1.getAddress(), amount);
    await vaultV1.connect(user).deposit(amount);
  });

  it("should preserve user balances after upgrade", async function () {
    const balanceBefore = await vaultV1.balanceOf(user.address);
    const TokenVaultV2 = await ethers.getContractFactory("TokenVaultV2");
    vaultV2 = await upgrades.upgradeProxy(await vaultV1.getAddress(), TokenVaultV2, {
        call: { fn: "initializeV2", args: [YIELD_RATE] }
    });
    expect(await vaultV2.balanceOf(user.address)).to.equal(balanceBefore);
  });

  it("should preserve total deposits after upgrade", async function () {
    const totalBefore = await vaultV1.totalDeposits();
    const TokenVaultV2 = await ethers.getContractFactory("TokenVaultV2");
    vaultV2 = await upgrades.upgradeProxy(await vaultV1.getAddress(), TokenVaultV2, {
        call: { fn: "initializeV2", args: [YIELD_RATE] }
    });
    expect(await vaultV2.totalDeposits()).to.equal(totalBefore);
  });

  it("should maintain admin access control after upgrade", async function () {
    const TokenVaultV2 = await ethers.getContractFactory("TokenVaultV2");
    vaultV2 = await upgrades.upgradeProxy(await vaultV1.getAddress(), TokenVaultV2, {
        call: { fn: "initializeV2", args: [YIELD_RATE] }
    });
    const UPGRADER_ROLE = await vaultV2.UPGRADER_ROLE();
    expect(await vaultV2.hasRole(UPGRADER_ROLE, admin.address)).to.be.true;
  });

  it("should allow setting yield rate in V2", async function () {
    const TokenVaultV2 = await ethers.getContractFactory("TokenVaultV2");
    vaultV2 = await upgrades.upgradeProxy(await vaultV1.getAddress(), TokenVaultV2, {
        call: { fn: "initializeV2", args: [YIELD_RATE] }
    });
    await vaultV2.connect(admin).setYieldRate(2000);
    expect(await vaultV2.getYieldRate()).to.equal(2000);
  });

    it("should calculate yield correctly", async function () {
    const TokenVaultV2 = await ethers.getContractFactory("TokenVaultV2");
    vaultV2 = await upgrades.upgradeProxy(await vaultV1.getAddress(), TokenVaultV2, {
        call: { fn: "initializeV2", args: [YIELD_RATE] }
    });
    
    // TRIGGER: Call claimYield or a deposit to initialize the user's lastYieldTimestamp in V2
    await vaultV2.connect(user).claimYield(); 

    // Fast forward 1 year
    await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");

    const yieldAmount = await vaultV2.getUserYield(user.address);
    expect(yieldAmount).to.be.gt(0);
    });

  it("should prevent non-admin from setting yield rate", async function () {
    const TokenVaultV2 = await ethers.getContractFactory("TokenVaultV2");
    vaultV2 = await upgrades.upgradeProxy(await vaultV1.getAddress(), TokenVaultV2, {
        call: { fn: "initializeV2", args: [YIELD_RATE] }
    });
    await expect(vaultV2.connect(user).setYieldRate(2000)).to.be.reverted;
  });

  it("should allow pausing deposits in V2", async function () {
    const TokenVaultV2 = await ethers.getContractFactory("TokenVaultV2");
    vaultV2 = await upgrades.upgradeProxy(await vaultV1.getAddress(), TokenVaultV2, {
        call: { fn: "initializeV2", args: [YIELD_RATE] }
    });
    await vaultV2.connect(admin).pauseDeposits();
    expect(await vaultV2.isDepositsPaused()).to.be.true;
  });
});