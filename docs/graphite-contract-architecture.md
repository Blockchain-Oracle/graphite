# Graphite Trust NFT System: Contract Architecture

## System Overview

The Graphite Trust NFT System is designed to create a sybil-resistant ecosystem that leverages Graphite's native reputation and KYC systems. The architecture consists of several interoperating smart contracts that manage NFT badges, trust scores, and token airdrops.

```
┌─────────────────────────────────┐
│  GraphiteReputationEcosystem    │
│                                 │
│  - Coordinates all components   │
│  - Manages user interactions    │
└───────────┬──────────┬──────────┘
            │          │
            ▼          ▼
┌─────────────────┐  ┌─────────────────┐
│  GraphiteTrustNFT│  │GraphiteAirdrop  │
│                 │  │Factory          │
│  - Badge NFTs   │  │                 │
│  - Tier system  │  │ - Creates       │
└────────┬────────┘  │   airdrops      │
         │           └────────┬────────┘
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│ GraphiteTrust   │  │ SybilResistant  │
│ ScoreAdapter    │  │ Airdrop         │
│                 │  │                 │
│ - Bridge to     │  │ - Token         │
│   Reputation    │  │   distribution  │
└────────┬────────┘  └────────┬────────┘
         │                    │
         ▼                    ▼
┌─────────────────────────────────────┐
│       Graphite System Contracts      │
│                                      │
│  - Reputation (0x...1008)            │
│  - KYC (0x...1001)                   │
│  - Activation (0x...1000)            │
│  - Filter (0x...1002)                │
└──────────────────────────────────────┘
```

## Contract Components

### 1. GraphiteReputationEcosystem

**Purpose**: Central contract that orchestrates interactions between all components.

**Key Functions**:
- `mintNFT()`: Mints a trust badge NFT for a user
- `updateTrustScore(tokenId)`: Updates an NFT's trust score
- `getEligibleAirdrops()`: Lists airdrops a user is eligible for
- `activateAccount()`: Activates a user's Graphite account
- `setKYCFilter(level)`: Sets a user's KYC filter level

**Interactions**:
- Calls `GraphiteTrustNFT` for badge creation and management
- Calls `GraphiteAirdropFactory` to track airdrops
- Interacts with Graphite system contracts

### 2. GraphiteTrustNFT

**Purpose**: ERC721 token representing a user's trust level with dynamic metadata.

**Key Features**:
- Dynamic trust badges that evolve with user's trust score
- Customizable badge types, names, and messages
- Verification status for special badges
- Tier-based visual representation (1-5 tiers)

**Key Functions**:
- `mint()`: Mints a new trust badge
- `refreshTrustScore(tokenId)`: Updates a badge's trust score
- `customizeBadge(tokenId, badgeType, name, message)`: Customizes a badge
- `tokenURI(tokenId)`: Returns badge metadata URI

### 3. GraphiteTrustScoreAdapter

**Purpose**: Adapter that bridges between Graphite's Reputation system and our Trust Score interface.

**Key Functions**:
- `getTrustScore(address)`: Gets trust score (0-1000) by scaling reputation
- `getTierLevel(trustScore)`: Determines tier level (1-5) from trust score
- `meetsTrustThreshold(address, minScore)`: Checks if an address meets a minimum trust score

**Implementation Details**:
- Connects to Graphite's Reputation contract at `0x0000000000000000000000000000000000001008`
- Scales reputation scores (0-6.5) to trust scores (0-1000) using a scaling factor of 154
- Maps scores to tiers:
  - Tier 1 (Beginner): 0-199
  - Tier 2 (Novice): 200-399
  - Tier 3 (Trusted): 400-599
  - Tier 4 (Established): 600-799
  - Tier 5 (Elite): 800-1000

### 4. GraphiteAirdropFactory

**Purpose**: Factory contract for creating and managing sybil-resistant token airdrops.

**Key Functions**:
- `createAirdrop(tokenAddress, merkleRoot, requirements...)`: Creates a new airdrop
- `getAirdrops()`: Lists all airdrops created by the factory
- `getCreatorAirdrops(address)`: Lists airdrops created by a specific address

**Features**:
- Preset templates with different trust/KYC requirements
- Ownership tracking for created airdrops
- Filtering capabilities for airdrop discovery

### 5. SybilResistantAirdrop

**Purpose**: Contract for token distributions that enforces reputation-based eligibility.

**Key Functions**:
- `claim(amount, proof)`: Claims tokens if eligible and verified by Merkle proof
- `setRequirements(trustScore, kycLevel, accountAge)`: Sets eligibility requirements
- `isEligible(address)`: Checks if an address meets all requirements

**Key Requirements**:
- Minimum trust score (default: 500)
- Minimum KYC level (default: 1)
- Minimum account age (default: 30 days)
- Minimum reputation score (default: 2.0)

**Security Features**:
- Merkle proof verification
- Blacklist for known Sybil attackers
- Time-based constraints (start/end times)
- Trust score and KYC verification

## Graphite System Contracts

The system integrates with Graphite's native contracts:

### 1. Reputation Contract (`0x0000000000000000000000000000000000001008`)

Calculates reputation scores based on:
- Creation date (CD): 0-1 points
- Activation status (A): 0-1 points
- KYC level (KYC): 0-3 points
- Transaction quantity (QTx): 0-1 points
- Balance difference (Diff): 0-0.5 points

### 2. KYC Contract (`0x0000000000000000000000000000000000001001`)

Manages KYC verification levels (0-3).

### 3. Activation Contract (`0x0000000000000000000000000000000000001000`)

Handles account activation status.

### 4. Filter Contract (`0x0000000000000000000000000000000000001002`)

Provides transaction filtering based on KYC levels and other criteria.

## Trust Score & Tier System

The trust score is a 0-1000 value derived from Graphite's reputation score (0-6.5):

```
Trust Score = Reputation Score × 154 (capped at 1000)
```

This score maps to five tiers that determine visual representation and feature access:

1. **Tier 1 (0-199)**: Beginner level with basic features
2. **Tier 2 (200-399)**: Novice level with improved visuals
3. **Tier 3 (400-599)**: Trusted level with enhanced effects
4. **Tier 4 (600-799)**: Established level with premium features
5. **Tier 5 (800-1000)**: Elite level with exclusive effects and features

## Data Flow

1. User interactions start at the `GraphiteReputationEcosystem` contract
2. For trust scores, the request flows through:
   - Ecosystem → Adapter → Graphite Reputation Contract
3. For NFT operations, the flow is:
   - Ecosystem → GraphiteTrustNFT → Adapter (for score)
4. For airdrops, the flow is:
   - Ecosystem → AirdropFactory → SybilResistantAirdrop → Adapter (for eligibility)

## Design Patterns

The system employs several design patterns:

1. **Adapter Pattern**: `GraphiteTrustScoreAdapter` adapts Graphite's Reputation interface to our TrustScore interface
2. **Factory Pattern**: `GraphiteAirdropFactory` creates and tracks airdrop instances
3. **Facade Pattern**: `GraphiteReputationEcosystem` provides a simplified interface to the entire system
4. **Proxy Pattern**: NFT metadata is generated via proxy to allow dynamic changes

## Deployment Sequence

1. Deploy `GraphiteTrustScoreAdapter`
2. Deploy `GraphiteTrustNFT` with adapter address
3. Deploy `GraphiteAirdropFactory` with adapter address
4. Deploy `GraphiteReputationEcosystem` with NFT and factory addresses
5. Transfer NFT ownership to the ecosystem contract

## Security Considerations

1. **Sybil Resistance**: Multiple mechanisms prevent Sybil attacks:
   - Reputation scores based on on-chain activity
   - KYC verification requirements
   - Account age verification
   - Transaction history analysis

2. **Access Control**: Clearly defined ownership and role permissions

3. **Validation**: Input validation and error handling throughout

4. **Blacklisting**: Ability to blacklist addresses in airdrops

## Integration Points

Frontend applications integrate with the system via:

1. **NFT Minting & Viewing**: Through the ecosystem and NFT contracts
2. **Trust Score Display**: Via the adapter contract
3. **Airdrop Creation & Claiming**: Through the factory and airdrop contracts
4. **3D Avatar Integration**: Via Ready Player Me integration with trust tier-based effects

## Conclusion

The Graphite Trust NFT System creates a comprehensive reputation-based ecosystem by leveraging Graphite's native capabilities through an adapter pattern. This architecture allows for dynamic trust badges that evolve with user reputation while providing sybil resistance for token distributions." 