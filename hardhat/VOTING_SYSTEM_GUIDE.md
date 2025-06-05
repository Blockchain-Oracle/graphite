# Graphite Voting System Guide

This guide explains how to deploy and interact with the Graphite Voting System, which allows users to create, manage, and participate in votes on the Graphite blockchain.

## Overview

The Graphite Voting System consists of two main contracts:

1. **GraphiteVoteFactory**: A factory contract that creates and tracks individual vote contracts.
2. **GraphiteVote**: Individual vote contracts, each representing a specific voting proposal.

## Prerequisites

Before deploying these contracts, you must have:
1. The GraphiteTrustScoreAdapter already deployed.
2. An activated Graphite account with KYC (minimum level 1) to create votes.
3. Environment variables set up in a `.env` file.

Example `.env` file:
```
PRIVATE_KEY=your_private_key
ADAPTER_ADDRESS=0x... (address of your deployed GraphiteTrustScoreAdapter)
VOTE_FACTORY_ADDRESS=0x... (after deploying the vote factory)
VOTE_CONTRACT_ADDRESS=0x... (address of a specific vote contract)
OPTION_INDEX=0 (optional, for casting votes)
```

## Deployment

### 1. Deploy the GraphiteVoteFactory

First, deploy the GraphiteVoteFactory contract, which will create individual vote contracts.

```bash
# Deploy to testnet
pnpm run deploy:vote-factory

# Deploy to mainnet
pnpm run deploy:vote-factory:mainnet
```

After deployment, update your `.env` file with the `VOTE_FACTORY_ADDRESS`.

## Usage

### Creating a Vote

To create a new vote, use the `create:vote` script:

```bash
# Create on testnet
pnpm run create:vote

# Create on mainnet
pnpm run create:vote:mainnet
```

The default vote parameters are:
- Description: "Should we implement feature X?"
- Options: ["Yes", "No", "Abstain"]
- Duration: 1 week from now
- No token requirement
- Minimum trust score: 0
- Minimum KYC level: 1

After creating a vote, the script outputs the vote contract address. Store this address in your `.env` file as `VOTE_CONTRACT_ADDRESS`.

### Casting a Vote

To vote on a proposal, use the `cast:vote` script:

```bash
# Set the vote contract address and option
export VOTE_CONTRACT_ADDRESS=0x...
export OPTION_INDEX=0 # 0=Yes, 1=No, 2=Abstain in the default vote

# Cast a vote on testnet
pnpm run cast:vote

# Cast a vote on mainnet
pnpm run cast:vote:mainnet
```

## Eligibility Requirements

To create a vote, users must:
1. Have an activated Graphite account
2. Have KYC level 1 or higher (configurable by the factory owner)

To participate in a vote, users must meet the specific requirements set by the vote creator:
1. Have an activated Graphite account
2. Meet the minimum KYC level requirement
3. Meet the minimum trust score requirement
4. Hold the required amount of a specific ERC20 token (if applicable)

## Contract Functions

### GraphiteVoteFactory

- `createVote(...)`: Create a new vote with customized parameters
- `setCreatorMinimumKYCLevel(uint256)`: Set the minimum KYC level required to create votes
- `getVoteContractsCount()`: Get the total number of created votes
- `getVoteContractAtIndex(uint256)`: Get a vote contract address by index

### GraphiteVote

- `vote(uint256 optionIndex)`: Cast a vote for a specific option
- `canVote(address)`: Check if an address is eligible to vote
- `getEligibilityDetails(address)`: Get detailed eligibility information for an address
- `getOption(uint256)`: Get the text of a specific voting option
- `getOptionsCount()`: Get the number of options in the vote
- `getVoteCount(uint256)`: Get the vote count for a specific option

## Advanced Configuration

To modify the default parameters when creating a vote, edit the `create-vote.js` script and adjust the parameters to your needs:

```javascript
// Vote parameters
const description = "Your custom description";
const options = ["Option 1", "Option 2", "Option 3"];
const startTime = Math.floor(Date.now() / 1000); // Now
const endTime = startTime + (30 * 24 * 60 * 60); // 30 days
const requiredTokenBalance = ethers.utils.parseEther("100"); // 100 tokens
const requiredTrustScore = 400; // Trusted tier or higher
const requiredKYCLevel = 2; // KYC level 2 or higher
``` 