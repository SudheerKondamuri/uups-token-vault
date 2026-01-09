import pkg from "hardhat";
const { ethers, upgrades } = pkg;
async function main() {
  const [admin] = await ethers.getSigners();
  const MockToken = await ethers.getContractFactory("MockERC20");
  const token = await MockToken.deploy();
  await token.waitForDeployment();

  const TokenVaultV1 = await ethers.getContractFactory("TokenVaultV1");
  const vault = await upgrades.deployProxy(TokenVaultV1, [await token.getAddress(), admin.address, 500], {
    initializer: "initialize",
    kind: "uups",
  });
  await vault.waitForDeployment();
  console.log("Vault V1 deployed to:", await vault.getAddress());
}
main();