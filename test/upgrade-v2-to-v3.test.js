import { expect } from "chai";
import pkg from "hardhat";
const { ethers, upgrades } = pkg;

describe("TokenVault V3 Upgrade", function () {
  let vault, token, admin, user;
  const DELAY = 86400; // 1 day

  beforeEach(async function () {
    [admin, user] = await ethers.getSigners();
    const MockToken = await ethers.getContractFactory("MockERC20");
    token = await MockToken.deploy();

    const TokenVaultV1 = await ethers.getContractFactory("TokenVaultV1");
    const proxy = await upgrades.deployProxy(TokenVaultV1, [await token.getAddress(), admin.address, 0], { kind: 'uups' });

    const TokenVaultV2 = await ethers.getContractFactory("TokenVaultV2");
    await upgrades.upgradeProxy(await proxy.getAddress(), TokenVaultV2, {
        call: { fn: "initializeV2", args: [1000] }
    });

    const TokenVaultV3 = await ethers.getContractFactory("TokenVaultV3");
    vault = await upgrades.upgradeProxy(await proxy.getAddress(), TokenVaultV3, {
        call: { fn: "initializeV3", args: [DELAY] }
    });

    const amount = ethers.parseUnits("10", 18);
    await token.mint(user.address, amount);
    await token.connect(user).approve(await vault.getAddress(), amount);
    await vault.connect(user).deposit(amount);
  });

  it("should preserve all V2 state after upgrade", async function () {
    expect(await vault.yieldRate()).to.equal(1000);
    expect(await vault.getImplementationVersion()).to.equal("V3");
  });

  it("should allow setting withdrawal delay", async function () {
    await vault.connect(admin).setWithdrawalDelay(500);
    expect(await vault.getWithdrawalDelay()).to.equal(500);
  });

  it("should handle withdrawal requests correctly", async function () {
    const amount = ethers.parseUnits("1", 18);
    await vault.connect(user).requestWithdrawal(amount);
    const request = await vault.getWithdrawalRequest(user.address);
    expect(request.amount).to.equal(amount);
  });

  it("should enforce withdrawal delay", async function () {
    const amount = ethers.parseUnits("1", 18);
    await vault.connect(user).requestWithdrawal(amount);
    await expect(vault.connect(user).executeWithdrawal()).to.be.revertedWith("Delay not met");
  });

  it("should allow emergency withdrawals", async function () {
    const balanceBefore = await token.balanceOf(user.address);
    await vault.connect(user).emergencyWithdraw();
    expect(await token.balanceOf(user.address)).to.be.gt(balanceBefore);
  });

  it("should prevent premature withdrawal execution", async function () {
    const amount = ethers.parseUnits("1", 18);
    await vault.connect(user).requestWithdrawal(amount);
    // Move time forward only halfway
    await ethers.provider.send("evm_increaseTime", [DELAY / 2]);
    await ethers.provider.send("evm_mine");
    await expect(vault.connect(user).executeWithdrawal()).to.be.revertedWith("Delay not met");
  });
});