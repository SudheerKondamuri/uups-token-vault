import pkg from "hardhat";
const { ethers, upgrades } = pkg;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {

  const proxyAddress = process.env.PROXY_ADDRESS;

  if (!proxyAddress) {
    throw new Error("PROXY_ADDRESS not found in .env file");
  }

  const TokenVaultV3 = await ethers.getContractFactory("TokenVaultV3");

  const vault = await upgrades.upgradeProxy(proxyAddress,TokenVaultV3,{
    call: {
        fn: "initializeV3",
        args: [86400]
    }
  });
  await vault.waitForDeployment();

  console.log("Vault upgraded to V3 at:", await vault.getAddress());
  console.log("Current Version:", await vault.getImplementationVersion()); 
    
}

main();