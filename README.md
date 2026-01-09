# UUPS Upgradeable Token Vault

A **production-grade, three-tier upgradeable smart contract system** built using the **Universal Upgradeable Proxy Standard (UUPS)**.  
This project demonstrates advanced Ethereum smart contract engineering patterns including secure upgradeability, role-based access control (RBAC), storage collision protection, and timelocked withdrawals.

---

## Overview

This repository contains a fully versioned UUPS-based Token Vault designed for real-world production use.  
Each version increment introduces new functionality while maintaining strict storage layout safety and upgrade guarantees.

The system evolves across **three implementation versions (V1, V2, V3)** deployed behind a single proxy.

---

## Architecture & Design Patterns

### Universal Upgradeable Proxy Standard (UUPS)

This project follows the **UUPS (EIP-1822)** pattern, where upgrade logic resides in the implementation contract rather than the proxy.

**Key advantages:**
- Lower gas costs for users
- Explicit upgrade authorization
- Optional future removal of upgradeability

Upgrade authorization is enforced via the `_authorizeUpgrade()` function.

---

### Storage Layout Management

To ensure safe upgrades, **storage gaps** are used to prevent variable slot collisions.

| Version | Storage Gap | New Variables |
|------|-----------|--------------|
| V1 | 50 slots | assetToken, depositFee, _totalDeposits, _balances |
| V2 | 47 slots | yieldRate, lastYieldTimestamp, isPaused |
| V3 | 45 slots | withdrawalDelay, withdrawalRequests |

---

## Versioned Feature Specifications

### V1 – Foundational Vault

**Deposit Fee Formula**
```
fee = (amount * depositFee) / 10000
```

Only the net amount is credited to user balances.

---

### V2 – Yield & Operational Control

**Yield Formula**
```
yield = (balance * yieldRate * timeElapsed) / (365 days * 10000)
```

Includes deposit pausing for risk mitigation.

---

### V3 – Timelocked Security

- Two-step withdrawals with enforced delay
- Emergency withdrawals for protocol failure scenarios

---

## Access Control & Security

Uses **OpenZeppelin AccessControlUpgradeable**.

| Role | Responsibility |
|----|---------------|
| DEFAULT_ADMIN_ROLE | Manage parameters & roles |
| UPGRADER_ROLE | Authorize upgrades |
| PAUSER_ROLE | Pause deposits |

Security hardening includes:
- `_disableInitializers()`
- `reinitializer(version)`
- Strict RBAC checks

---

## Environment Variables (.env Setup)

This project uses **dotenv** for managing sensitive configuration values.

### Step 1: Create `.env` File

At the root of the project, create a file named `.env`:

```bash
touch .env
```

### Step 2: Add Required Variables

```env
PROXY_ADDRESS=0xYOUR_PROXY_ADDRESS
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
```

### Variable Explanation

| Variable | Description |
|-------|-------------|
| PROXY_ADDRESS | Address of the Proxy |
| SEPOLIA_RPC_URL | RPC endpoint for Sepolia testnet |
| PRIVATE_KEY | Deployer wallet private key (DO NOT COMMIT) |
| ETHERSCAN_API_KEY | Used for contract verification |


⚠️ **Security Warning**  
Never commit your `.env` file. Ensure `.gitignore` includes:

```
.env
```

---

## Development Workflow

### Prerequisites

- Node.js v20.x+
- Hardhat

### Install Dependencies

```bash
npm install
```

---

### Testing

```bash
npx hardhat test
```

---

### Deployment

**Deploy V1**
```bash
npx hardhat run scripts/deploy-v1.js --network sepolia
```

**Upgrade to V2**
```bash
npx hardhat run scripts/upgrade-to-v2.js --network sepolia
```

**Upgrade to V3**
```bash
npx hardhat run scripts/upgrade-to-v3.js --network sepolia
```

---

## License

MIT License

---

## Author

**Kondamuri Satya Sudheer**  
Framework: Hardhat
