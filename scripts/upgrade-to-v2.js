import pkg from "hardhat";
const { ethers, upgrades } = pkg;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {

  const proxyAddress = process.env.PROXY_ADDRESS;

  if (!proxyAddress) {
    throw new Error("PROXY_ADDRESS not found in .env file");
  }

  console.log("Upgrading to V2...");
  const TokenVaultV2 = await ethers.getContractFactory("TokenVaultV2");

  // upgradeProxy handles:
  // 1. Deploying the new TokenVaultV2 implementation
  // 2. Calling upgradeToAndCall on the Proxy
  // 3. Executing initializeV2 (reinitializer 2) with the yield rate
  const vault = await upgrades.upgradeProxy(proxyAddress, TokenVaultV2, {
    call: {
      fn: "initializeV2",
      args: [1000], // Setting yieldRate to 10% (1000/10000)
    }
  });

  await vault.waitForDeployment();

  console.log("Vault upgraded to V2 at:", await vault.getAddress());
  console.log("Current Version:", await vault.getImplementationVersion()); // Should return "V2"
}

main();