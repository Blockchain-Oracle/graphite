# Graphite Ecosystem Deployment Guide

We've set up a deployment system for the Graphite ecosystem contracts that works around the Graphite network's 1.00 ETH transaction fee cap. The deployment is split into three separate steps to keep each transaction under the fee cap.

## Current Setup

1. **Hardhat Configuration**: 
   - Set up in `hardhat.config.js` with specific configurations for both testnet and mainnet
   - Gas price and limit settings are configured to work within the network's constraints

2. **Deployment Scripts**:
   - `deploy-nft.js`: Deploys the GraphiteTrustScoreAdapter and the GraphiteTrustNFT contract
   - `deploy-factory.js`: Deploys just the GraphiteAirdropFactory contract
   - `deploy-ecosystem.js`: Deploys the GraphiteReputationEcosystem and links all contracts together

3. **Environment Configuration**:
   - `.env` file for storing the private key and contract addresses for multi-step deployment

## Important Update: Reputation Contract Integration

We've implemented an adapter pattern to bridge between Graphite's actual Reputation system and our custom TrustScore interface. The GraphiteTrustScoreAdapter:

1. Connects to the real Graphite Reputation contract at `0x0000000000000000000000000000000000001008`
2. Converts the reputation score (0-6.5 range) to a trust score (0-1000 range)
3. Provides tier calculation logic based on the scaled score
4. Implements threshold checking logic required by our interface

This allows our contracts to work with Graphite's actual implementation rather than assuming a non-existent TrustScore contract.

## Deployment Instructions

### Prerequisites

1. **Sufficient Funds**: Ensure your account has at least 0.5 ETH for each deployment step (total ~1.5 ETH)
2. **Node.js Environment**: Make sure you have a compatible Node.js version

### Step 1: Deploy GraphiteTrustScoreAdapter and GraphiteTrustNFT

```bash
npx hardhat run deploy-nft.js --network graphite_testnet
```

After successful deployment, copy the adapter and NFT contract addresses and update them in the `.env` file:
```
ADAPTER_ADDRESS=0x7ae81A377Ba8352be0fC5162D39Ba1e32035Ac10  # Replace with your actual adapter address
NFT_ADDRESS=0x8bc81A377Ba8352be0fC5162D39Ba1e32035Ac20  # Replace with your actual NFT address
```

### Step 2: Deploy GraphiteAirdropFactory

```bash
npx hardhat run deploy-factory.js --network graphite_testnet
```

After successful deployment, copy the Factory contract address and update it in the `.env` file:
```
FACTORY_ADDRESS=0xFb669cfFD00894Ab8BD8c6a6291781744281a831  # Replace with your actual address
```

### Step 3: Deploy GraphiteReputationEcosystem

Make sure you've updated the `.env` file with the addresses from the previous steps:

```bash
npx hardhat run deploy-ecosystem.js --network graphite_testnet
```

After successful deployment, update the ECOSYSTEM_ADDRESS in your `.env` file.

### Step 4: Transfer NFT Ownership to Ecosystem

```bash
npx hardhat run transfer-ownership.js --network graphite_testnet
```

## Deployment to Mainnet

For mainnet deployment, use the `graphite` network instead:

```bash
npx hardhat run deploy-nft.js --network graphite
npx hardhat run deploy-factory.js --network graphite
npx hardhat run deploy-ecosystem.js --network graphite
npx hardhat run transfer-ownership.js --network graphite
```

## Troubleshooting

If you encounter the "insufficient funds" error:

1. **Check Balance**: Ensure your account has enough ETH for the transaction
   ```bash
   npx hardhat run scripts/check-balance.js --network graphite_testnet
   ```

2. **Adjust Gas Settings**: If needed, you can modify the gas price and limit in `hardhat.config.js`:
   ```js
   graphite_testnet: {
     // ...
     gasPrice: 100000000000, // 100 gwei - decrease this if needed
     gas: 2000000,          // decrease this for smaller transactions
   }
   ```

3. **Deploy Smaller Contracts First**: The NFT contract is the largest and most expensive to deploy

## Contract Interactions

After deployment, you can interact with the contracts using scripts:

```bash
npx hardhat run scripts/mint-nft.js --network graphite_testnet
npx hardhat run scripts/create-airdrop.js --network graphite_testnet
```

## Contract Addresses

Keep track of your deployed contract addresses:

- GraphiteTrustScoreAdapter: `<your-adapter-address>`
- GraphiteTrustNFT: `<your-nft-address>`
- GraphiteAirdropFactory: `<your-factory-address>`
- GraphiteReputationEcosystem: `<your-ecosystem-address>` 