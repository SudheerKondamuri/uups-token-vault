import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: "0.8.22",
  networks: {
    hardhat: {}, 
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    }
  }
};

export default config;