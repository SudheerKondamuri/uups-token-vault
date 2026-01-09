import { expect } from "chai";
import pkg from "hardhat";
const { ethers, upgrades } = pkg;

describe("TokenVaultV1", function () {
  let vault, token, admin, user;
  const FEE = 500; // 5%

  beforeEach(async function () {
    [admin, user] = await ethers.getSigners();
    const MockToken = await ethers.getContractFactory("MockERC20");
    token = await MockToken.deploy();
    const TokenVaultV1 = await ethers.getContractFactory("TokenVaultV1");
    vault = await upgrades.deployProxy(TokenVaultV1, [await token.getAddress(), admin.address, FEE], { kind: 'uups' });
  });

  it("should initialize with correct parameters", async function () {
    expect(await vault.assetToken()).to.equal(await token.getAddress());
    expect(await vault.getDepositFee()).to.equal(FEE);
  });

  it("should allow deposits and update balances", async function () {
    const amount = ethers.parseUnits("100", 18);
    await token.mint(user.address, amount);
    await token.connect(user).approve(await vault.getAddress(), amount);
    await vault.connect(user).deposit(amount);
    // 100 - 5% fee = 95
    expect(await vault.balanceOf(user.address)).to.equal(ethers.parseUnits("95", 18));
  });

  it("should deduct deposit fee correctly", async function () {
    const amount = ethers.parseUnits("1000", 18);
    await token.mint(user.address, amount);
    await token.connect(user).approve(await vault.getAddress(), amount);
    await vault.connect(user).deposit(amount);
    expect(await vault.totalDeposits()).to.equal(ethers.parseUnits("950", 18));
  });

  it("should allow withdrawals and update balances", async function () {
    const amount = ethers.parseUnits("100", 18);
    await token.mint(user.address, amount);
    await token.connect(user).approve(await vault.getAddress(), amount);
    await vault.connect(user).deposit(amount);
    const vaultBalance = await vault.balanceOf(user.address);
    await vault.connect(user).withdraw(vaultBalance);
    expect(await vault.balanceOf(user.address)).to.equal(0);
  });

  it("should prevent withdrawal of more than balance", async function () {
    await expect(vault.connect(user).withdraw(1)).to.be.revertedWith("Insufficient balance");
  });

  it("should prevent reinitialization", async function () {
    await expect(vault.initialize(ethers.ZeroAddress, admin.address, 0)).to.be.reverted;
  });
});