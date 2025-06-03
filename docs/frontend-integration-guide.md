# Graphite Trust NFT & Reputation System: Frontend Integration Guide

## System Overview

The Graphite Trust NFT system is a decentralized application that leverages Graphite's native reputation system to create dynamic NFT badges that evolve based on a user's trust score. The system consists of several contracts that work together to provide a sybil-resistant ecosystem for reputation-based interactions.

### Key Components

1. **GraphiteTrustScoreAdapter**: A bridge between Graphite's native Reputation contract and our Trust Score interface.
2. **GraphiteTrustNFT**: An ERC721 NFT contract that mints badges tied to user trust scores.
3. **SybilResistantAirdrop**: A contract for distributing tokens to users who meet reputation requirements.
4. **GraphiteAirdropFactory**: A factory contract for creating and managing airdrops.
5. **GraphiteReputationEcosystem**: The main contract that ties everything together.

## Adapter Pattern: Reputation to Trust Score

### Why an Adapter?

Graphite's actual implementation uses a Reputation contract (`0x0000000000000000000000000000000000001008`) that returns scores in the range of 0-6.5. Our system was designed for a Trust Score interface with scores in the range of 0-1000. 

Rather than modifying all our contracts, we implemented an adapter pattern that:
1. Connects to the real Graphite Reputation contract
2. Converts reputation scores (0-6.5) to trust scores (0-1000)
3. Provides tier calculations based on the scaled scores

### How the Adapter Works

```
Reputation Score (0-6.5) * 154 = Trust Score (0-1000)
```

The adapter maps these scores to five tiers:
- Tier 1 (Beginner): 0-199
- Tier 2 (Novice): 200-399
- Tier 3 (Trusted): 400-599
- Tier 4 (Established): 600-799
- Tier 5 (Elite): 800-1000

## Deployed Contract Addresses

After deployment, you'll have the following contract addresses:

- **GraphiteTrustScoreAdapter**: [deployed adapter address]
- **GraphiteTrustNFT**: [deployed NFT address]
- **GraphiteAirdropFactory**: [deployed factory address]
- **GraphiteReputationEcosystem**: [deployed ecosystem address]

## Frontend Integration

### 1. Trust Score Integration

To fetch a user's trust score:

```typescript
import { useContractRead } from 'wagmi';
import { ADAPTER_ADDRESS } from '@/lib/constants';
import { GraphiteTrustScoreAdapterABI } from '@/lib/abis';

export function useTrustScore(address) {
  const { data, isLoading, error } = useContractRead({
    address: ADAPTER_ADDRESS,
    abi: GraphiteTrustScoreAdapterABI,
    functionName: 'getTrustScore',
    args: [address],
    enabled: !!address,
  });

  return {
    trustScore: data ? Number(data) : 0,
    isLoading,
    error,
  };
}
```

To get a user's tier level:

```typescript
export function useTrustTier(trustScore) {
  const { data, isLoading, error } = useContractRead({
    address: ADAPTER_ADDRESS,
    abi: GraphiteTrustScoreAdapterABI,
    functionName: 'getTierLevel',
    args: [trustScore],
    enabled: trustScore !== undefined,
  });

  return {
    tier: data ? Number(data) : 1,
    isLoading,
    error,
  };
}
```

### 2. NFT Badge Integration

To mint a new NFT badge:

```typescript
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { NFT_ADDRESS, ECOSYSTEM_ADDRESS } from '@/lib/constants';
import { GraphiteReputationEcosystemABI } from '@/lib/abis';

export function useMintNFT() {
  const { config } = usePrepareContractWrite({
    address: ECOSYSTEM_ADDRESS,
    abi: GraphiteReputationEcosystemABI,
    functionName: 'mintNFT',
  });

  const { data, isLoading, isSuccess, write, error } = useContractWrite(config);

  return {
    mint: write,
    isLoading,
    isSuccess,
    error,
    txData: data,
  };
}
```

To fetch a user's NFTs:

```typescript
import { useContractReads } from 'wagmi';
import { NFT_ADDRESS } from '@/lib/constants';
import { GraphiteTrustNFTABI } from '@/lib/abis';

export function useUserNFTs(address) {
  // First get balance
  const { data: balance, isLoading: balanceLoading } = useContractRead({
    address: NFT_ADDRESS,
    abi: GraphiteTrustNFTABI,
    functionName: 'balanceOf',
    args: [address],
    enabled: !!address,
  });

  // Then get token IDs
  const tokenQueries = [];
  if (balance) {
    for (let i = 0; i < Number(balance); i++) {
      tokenQueries.push({
        address: NFT_ADDRESS,
        abi: GraphiteTrustNFTABI,
        functionName: 'tokenOfOwnerByIndex',
        args: [address, i],
      });
    }
  }

  const { data: tokenIds, isLoading: tokensLoading } = useContractReads({
    contracts: tokenQueries,
    enabled: balance > 0,
  });

  // Then get metadata for each token
  const metadataQueries = [];
  if (tokenIds) {
    tokenIds.forEach(id => {
      if (id) {
        metadataQueries.push({
          address: NFT_ADDRESS,
          abi: GraphiteTrustNFTABI,
          functionName: 'tokenURI',
          args: [id],
        });
        metadataQueries.push({
          address: NFT_ADDRESS,
          abi: GraphiteTrustNFTABI,
          functionName: 'lastTrustScore',
          args: [id],
        });
        metadataQueries.push({
          address: NFT_ADDRESS,
          abi: GraphiteTrustNFTABI,
          functionName: 'getBadgeData',
          args: [id],
        });
      }
    });
  }

  const { data: nftData, isLoading: metadataLoading } = useContractReads({
    contracts: metadataQueries,
    enabled: tokenIds && tokenIds.length > 0,
  });

  // Format the data
  const nfts = [];
  if (tokenIds && nftData) {
    for (let i = 0; i < tokenIds.length; i++) {
      const tokenId = tokenIds[i];
      const metadataIndex = i * 3;
      
      nfts.push({
        id: tokenId.toString(),
        tokenURI: nftData[metadataIndex],
        trustScore: Number(nftData[metadataIndex + 1]),
        badgeData: nftData[metadataIndex + 2],
      });
    }
  }

  return {
    nfts,
    isLoading: balanceLoading || tokensLoading || metadataLoading,
  };
}
```

### 3. Customizing NFT Badges

To customize an NFT badge:

```typescript
export function useCustomizeNFT(tokenId) {
  const { config } = usePrepareContractWrite({
    address: NFT_ADDRESS,
    abi: GraphiteTrustNFTABI,
    functionName: 'customizeBadge',
    args: [tokenId, badgeType, badgeName, badgeMessage],
  });

  const { data, isLoading, isSuccess, write, error } = useContractWrite(config);

  return {
    customize: write,
    isLoading,
    isSuccess,
    error,
    txData: data,
  };
}
```

### 4. Creating Airdrops

To create a new airdrop:

```typescript
export function useCreateAirdrop() {
  const { config } = usePrepareContractWrite({
    address: FACTORY_ADDRESS,
    abi: GraphiteAirdropFactoryABI,
    functionName: 'createAirdrop',
    args: [
      tokenAddress,
      merkleRoot,
      requiredTrustScore,
      requiredKYCLevel,
      requiredAccountAge,
      startTime,
      endTime
    ],
  });

  const { data, isLoading, isSuccess, write, error } = useContractWrite(config);

  return {
    createAirdrop: write,
    isLoading,
    isSuccess,
    error,
    txData: data,
  };
}
```

### 5. Claiming Airdrops

To claim tokens from an airdrop:

```typescript
export function useClaimAirdrop(airdropAddress, amount, proof) {
  const { config } = usePrepareContractWrite({
    address: airdropAddress,
    abi: SybilResistantAirdropABI,
    functionName: 'claim',
    args: [amount, proof],
  });

  const { data, isLoading, isSuccess, write, error } = useContractWrite(config);

  return {
    claim: write,
    isLoading,
    isSuccess,
    error,
    txData: data,
  };
}
```

## Visual Representation & 3D Integration

The trust badges have different visual representations based on the tier level. The frontend should:

1. Display the appropriate badge model based on the tier (1-5)
2. Use Ready Player Me for 3D avatar integration 
3. Apply special effects based on the tier level

### Tier-Based Effects

```typescript
// Example mapping of tiers to visual effects
const TIER_EFFECTS = {
  1: { 
    color: '#607D8B', 
    particles: 'minimal',
    glow: 'subtle',
  },
  2: { 
    color: '#4CAF50', 
    particles: 'light',
    glow: 'faint',
  },
  3: { 
    color: '#2196F3', 
    particles: 'medium',
    glow: 'moderate',
  },
  4: { 
    color: '#9C27B0', 
    particles: 'dense',
    glow: 'bright',
  },
  5: { 
    color: '#FFC107', 
    particles: 'intense',
    glow: 'radiant',
    specialEffects: ['halo', 'sparkles'],
  },
};
```

## Trust Score Calculation

The trust score is calculated from Graphite's Reputation system, which evaluates:

1. **Creation Date (CD)**: How old the account is (0-1 points)
2. **Activation (A)**: Whether the account is activated (0-1 points)
3. **KYC Level**: Level of KYC verification (0-3 points)
4. **Transaction Quantity (QTx)**: Number of transactions (0-1 points)
5. **Balance Difference (Diff)**: Difference between inflows and outflows (0-0.5 points)

The total reputation score (0-6.5) is then scaled to a trust score (0-1000).

## Merkle Tree for Airdrops

For airdrops, we use Merkle trees to efficiently verify eligibility. The frontend should:

1. Generate a Merkle tree from the list of eligible addresses and amounts
2. Generate Merkle proofs for individual users
3. Pass the proof when claiming the airdrop

```typescript
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';

// Generate Merkle tree
function generateMerkleTree(airdropList) {
  const leaves = airdropList.map(item => 
    keccak256(
      Buffer.concat([
        Buffer.from(item.address.slice(2), 'hex'),
        Buffer.from(item.amount.toString(16).padStart(64, '0'), 'hex')
      ])
    )
  );
  
  return new MerkleTree(leaves, keccak256, { sort: true });
}

// Generate proof for a specific address and amount
function generateMerkleProof(merkleTree, address, amount) {
  const leaf = keccak256(
    Buffer.concat([
      Buffer.from(address.slice(2), 'hex'),
      Buffer.from(amount.toString(16).padStart(64, '0'), 'hex')
    ])
  );
  
  return merkleTree.getHexProof(leaf);
}
```

## Error Handling

Common error scenarios to handle in the frontend:

1. **Insufficient Trust Score**: User doesn't meet the required trust score
2. **Account Not Activated**: User hasn't activated their Graphite account
3. **Insufficient KYC Level**: User's KYC level is too low
4. **Transaction Blocked**: Transaction blocked by Graphite's filter system
5. **Already Claimed**: User has already claimed from this airdrop
6. **Invalid Proof**: The Merkle proof is invalid
7. **Airdrop Not Started/Ended**: The airdrop hasn't started or has already ended

## Ready Player Me Integration

For 3D avatar integration with Ready Player Me, follow these steps:

1. Add the RPMAvatarCreator component to enable users to create avatars
2. Save the avatarId to the blockchain via the NFT customization feature
3. Use the EnhancedAvatarViewer to display avatars with trust score-based effects

Example integration:

```jsx
import RPMAvatarCreator from '@/components/RPMAvatarCreator';
import EnhancedAvatarViewer from '@/components/EnhancedAvatarViewer';
import { useTrustScore } from '@/hooks/web3';

function AvatarPage() {
  const [avatarId, setAvatarId] = useState('');
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const { address } = useAccount();
  const { trustScore, isLoading } = useTrustScore(address);
  const { tier } = useTrustTier(trustScore);
  
  const handleAvatarCreated = (newAvatarId) => {
    setAvatarId(newAvatarId);
    // Save to blockchain
  };
  
  return (
    <div>
      <button onClick={() => setIsCreatorOpen(true)}>
        Create 3D Avatar
      </button>
      
      <RPMAvatarCreator
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        onAvatarCreated={handleAvatarCreated}
      />
      
      {avatarId && (
        <div className="h-[500px]">
          <EnhancedAvatarViewer
            avatarId={avatarId}
            tier={tier}
            trustScore={trustScore}
            autoRotate={false}
            showEffects={true}
          />
        </div>
      )}
    </div>
  );
}
```

## Conclusion

This integration guide provides a foundation for connecting the frontend application to the Graphite Trust NFT system. The adapter pattern ensures compatibility with Graphite's actual implementation while maintaining the structure of our custom trust-based system.

For any questions or issues, please refer to the contract documentation or reach out to the development team. 