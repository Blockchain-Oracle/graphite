# Graphite Trust NFT System: Detailed Contract Architecture

## 1. Introduction

The Graphite Trust NFT System is a decentralized application designed to create a sybil-resistant ecosystem. It leverages Graphite's native reputation, KYC (Know Your Customer), and account activation (Fee) systems. The architecture comprises several interoperating smart contracts managing dynamic NFT badges, trust scores (derived from Graphite's reputation), and token airdrops.

This document provides a low-level technical description of each smart contract, its functionalities, and its interactions within the ecosystem and with Graphite's core infrastructure.

**Key Change from Previous Architecture**: The system has been refactored to remove internal interface abstractions (like `IGraphiteKYC`, `IGraphiteFee`, `IGraphiteFilter`). The primary contracts (`GraphiteReputationEcosystem`, `GraphiteAirdropFactory`, `SybilResistantAirdrop`) now interact *directly* with Graphite's official system contracts using their fixed addresses and native ABIs.

## Table of Contents
- [1. Introduction](#1-introduction)
- [2. System Diagram](#2-system-diagram)
- [3. Core Contract Details](#3-core-contract-details)
  - [3.1. `GraphiteTrustScoreAdapter.sol`](#31-graphitetrustscoreadaptersol)
  - [3.2. `GraphiteTrustNFT.sol`](#32-graphitetrustnftsol)
  - [3.3. `GraphiteAirdropFactory.sol`](#33-graphiteairdropfactorysol)
  - [3.4. `SybilResistantAirdrop.sol`](#34-sybilresistantairdropsol)
  - [3.5. `GraphiteReputationEcosystem.sol`](#35-graphitereputationecosystemsol)
- [4. Interactions and Data Flow Summary](#4-interactions-and-data-flow-summary)
- [5. Voting System Contracts](#5-voting-system-contracts)
  - [5.1. `GraphiteVoteFactory.sol`](#51-graphitevotefactorysol)
  - [5.2. `GraphiteVote.sol`](#52-graphitevotesol)
- [Conclusion](#conclusion)

## 2. System Diagram

```
┌─────────────────────────────────┐
│  GraphiteReputationEcosystem    │(Orchestrator)
│  - Manages user interactions    │
│  - Calls Graphite System Contracts│
│  - Owns GraphiteTrustNFT        │
└───────┬────┬─────┬────┬────────┘
        │    │     │    │
        ▼    │     ▼    │
┌───────────────┐ │ ┌───────────────┐
│GraphiteTrustNFT │ │GraphiteAirdrop│
│- ERC721 Badges│ │Factory        │
│- Dynamic URI  │ │- Creates Sybil│
│- Tier System  │ │ ResistantAidrops│
└───────┬───────┘ │└───────┬───────┘
        │         │        │
        ▼         │        ▼
┌───────────────┐ │ ┌────────────────────┐
│GraphiteTrust  │ │ │SybilResistantAirdrop │ (Instance)
│ScoreAdapter   │ │ │- Token Distribution │
│- Converts Rep │ │ │- Enforces Eligibility│
│  to TrustScore│ │ │- Calls Graphite Sys │
└───────┬───────┘ │ └──────────┬─────────┘
        │         │            │
        └─────────┼────────────┘
                  │
                  ▼
┌───────────────────────────────────────────────────┐
│              Graphite System Contracts            │
│                                                   │
│  - Reputation (REPUTATION_CONTRACT_ADDRESS)       │
│  - KYC (KYC_CONTRACT_ADDRESS)                     │
│  - Fee/Activation (FEE_CONTRACT_ADDRESS)          │
│  - Filter (FILTER_CONTRACT_ADDRESS)               │
└───────────────────────────────────────────────────┘
```

**Fixed Graphite System Contract Addresses:**
*   **KYC Contract**: `0x0000000000000000000000000000000000001001`
*   **Fee/Activation Contract**: `0x0000000000000000000000000000000000001000`
*   **Reputation Contract**: `0x0000000000000000000000000000000000001008`
*   **Filter Contract**: `0x0000000000000000000000000000000000001002`

## 3. Core Contract Details

### 3.1. `GraphiteTrustScoreAdapter.sol`

**Source**: `contract/hardhat/contracts/GraphiteTrustScoreAdapter.sol` (or `contract/src/GraphiteTrustScoreAdapter.sol`)

**Purpose**: This contract acts as a bridge, converting raw reputation scores from Graphite's native `Reputation` contract into a 0-1000 trust score compatible with the ecosystem's tiering system. The `TestAdapter.sol` provides a concrete implementation of this scaling.

**Interfaces Implemented**: `IGraphiteTrustScore`

#### Key State Variables:
*   `REPUTATION_CONTRACT_ADDRESS` (public constant address): `0x0000000000000000000000000000000000001008`. The official Graphite Reputation contract.
*   `reputationContract` (private IGraphiteReputation): Instance of the Graphite Reputation contract.
*   `MAX_REPUTATION` (private constant uint256): `650`. The conceptual maximum score from Graphite's `Reputation` contract (as it sums components that can lead to approximately this value, though it's not a hard cap in the Graphite contract itself).
*   `MAX_TRUST_SCORE` (private constant uint256): `1000`. The maximum score in this ecosystem's trust score system.

#### Core Functions:

*   **`constructor()`**:
    *   Initializes `reputationContract` with `REPUTATION_CONTRACT_ADDRESS`.

*   **`getTrustScore(address user) external view returns (uint256 trustScore)`**:
    *   **Purpose**: Retrieves the Graphite reputation for the `user`, scales it, and returns the ecosystem-specific trust score.
    *   **Logic**:
        1.  Calls `reputationContract.getReputation(user)` to get the raw score (0-approx 650). Graphite's `getReputation` function returns a score that is already effectively multiplied by 100 (e.g., a true score of 6.5 is returned as 650).
        2.  Scales this score: `trustScore = (reputationScore * MAX_TRUST_SCORE) / MAX_REPUTATION`.
        3.  Caps `trustScore` at `MAX_TRUST_SCORE` (1000).
    *   **Returns**: The calculated trust score (0-1000).

*   **`getTierLevel(uint256 trustScore) external pure returns (uint256 tier)`**:
    *   **Purpose**: Determines the user's tier based on their trust score.
    *   **Logic**:
        *   `trustScore < 200`: Tier 1 (Beginner)
        *   `trustScore < 400`: Tier 2 (Novice)
        *   `trustScore < 600`: Tier 3 (Trusted)
        *   `trustScore < 800`: Tier 4 (Established)
        *   `else`: Tier 5 (Elite)
    *   **Returns**: Tier level (1-5).

*   **`meetsTrustThreshold(address user, uint256 minScore) external view returns (bool meets)`**:
    *   **Purpose**: Checks if a user's trust score meets a minimum threshold.
    *   **Logic**: Calls `getTrustScore(user)` and compares it against `minScore`.
    *   **Returns**: `true` if `getTrustScore(user) >= minScore`, `false` otherwise.

### 3.2. `GraphiteTrustNFT.sol`

**Source**: `contract/src/GraphiteTrustNFT.sol` or `contract/hardhat/contracts/GraphiteTrustNFT.sol`

**Purpose**: An ERC721 token contract where each NFT represents a user's trust badge. The NFT's metadata (and thus appearance) can be dynamic, reflecting the user's trust score and customizations. This contract is typically owned by `GraphiteReputationEcosystem`.

**Inherits**: `ERC721Enumerable`, `Ownable`

#### Key State Variables:
*   `trustScoreContract` (public IGraphiteTrustScore): Address of the trust score adapter (e.g., `GraphiteTrustScoreAdapter` or `TestAdapter`).
*   `_customBaseURI` (private string): A base URI prefix for token metadata, primarily for off-chain resolution.
*   `metadataServer` (public string): URL of the server that generates detailed badge metadata.
*   `_lastTokenId` (private uint256): Counter for minting new token IDs.
*   `lastTrustScore` (mapping(uint256 => uint256)): Stores the trust score associated with a `tokenId` at the time of its last refresh or mint.
*   `_badgeData` (mapping(uint256 => BadgeData)): Stores customization data for each `tokenId`.
*   `lastCustomized` (mapping(uint256 => uint256)): Timestamp of the last customization for a `tokenId`.
*   `MAX_TRUST_SCORE` (private constant uint256): `1000`.

#### Structs:
*   **`BadgeData`**:
    *   `badgeType` (uint8): Badge template identifier (1-10).
    *   `badgeName` (string): Custom name for the badge.
    *   `badgeMessage` (string): Custom message on the badge.
    *   `verified` (bool): Special status, typically set by the contract owner.

#### Events:
*   `TrustScoreRefreshed(uint256 indexed tokenId, uint256 newScore)`
*   `BadgeCustomized(uint256 indexed tokenId, uint8 badgeType, string badgeName)`
*   `MetadataRefreshed(uint256 indexed tokenId)`: Emitted on score refresh or any customization, signaling metadata might need updating.

#### Errors:
*   `InsufficientTrustForCustomization()`
*   `NotTokenOwner()`
*   `InvalidBadgeType()`
*   `TokenDoesNotExist()`

#### Core Functions:

*   **`constructor(string memory name, string memory symbol, address _trustScoreAdapter, string memory baseURI_, string memory _metadataServer)`**:
    *   Initializes ERC721, sets owner, `trustScoreContract`, `_customBaseURI`, and `metadataServer`.

*   **`mint(address recipient) public payable virtual returns (uint256 tokenId)`**:
    *   **Purpose**: Mints a new NFT to `recipient`. Typically called by `GraphiteReputationEcosystem`.
    *   **Requires**: `msg.sender` should be owner (i.e., Ecosystem contract) or have appropriate rights if `payable` is used for a fee (though fees are usually handled by the Ecosystem contract).
    *   **Logic**:
        1.  Increments `_lastTokenId` to get a new `tokenId`.
        2.  Initializes `_badgeData[tokenId]` with default values (badgeType: 1).
        3.  Calls `trustScoreContract.getTrustScore(recipient)` to get the initial score and stores it in `lastTrustScore[tokenId]`.
        4.  Mints the NFT using `_mint(recipient, tokenId)`.
    *   **Returns**: The `tokenId` of the newly minted NFT.

*   **`mintWithModel(address recipient, uint8 badgeType) public payable returns (uint256 tokenId)`**:
    *   **Purpose**: Mints a new NFT with a specific initial `badgeType`.
    *   **Logic**: Similar to `mint`, but initializes `_badgeData[tokenId].badgeType` with the provided `badgeType`.
    *   **Reverts**: `InvalidBadgeType` if `badgeType` is not 1-10.

*   **`setBadgeName(uint256 tokenId, string calldata name) external`**:
    *   **Purpose**: Allows the token owner to set a custom name for their badge.
    *   **Requires**: `msg.sender` must be the owner of `tokenId`.
    *   **Logic**: Updates `_badgeData[tokenId].badgeName` and `lastCustomized[tokenId]`.
    *   **Emits**: `BadgeCustomized`, `MetadataRefreshed`.
    *   **Reverts**: `NotTokenOwner`.

*   **`setBadgeMessage(uint256 tokenId, string calldata message) external`**:
    *   **Purpose**: Allows the token owner to set a custom message for their badge.
    *   **Requires**: `msg.sender` must be the owner of `tokenId`.
    *   **Logic**: Updates `_badgeData[tokenId].badgeMessage` and `lastCustomized[tokenId]`.
    *   **Emits**: `MetadataRefreshed`.
    *   **Reverts**: `NotTokenOwner`.

*   **`setBadgeType(uint256 tokenId, uint8 badgeType) external`**:
    *   **Purpose**: Allows the token owner to change their badge type, subject to trust score requirements.
    *   **Requires**: `msg.sender` must be the owner of `tokenId`.
    *   **Logic**:
        1.  Checks `badgeType` is valid (1-10).
        2.  Fetches `msg.sender`'s current trust score: `trustScoreContract.getTrustScore(msg.sender)`.
        3.  Gets `requiredScore` for `badgeType` via `getBadgeTypeRequirement(badgeType)`.
        4.  Reverts with `InsufficientTrustForCustomization` if `ownerScore < requiredScore`.
        5.  Updates `_badgeData[tokenId].badgeType` and `lastCustomized[tokenId]`.
    *   **Emits**: `BadgeCustomized`, `MetadataRefreshed`.
    *   **Reverts**: `NotTokenOwner`, `InvalidBadgeType`, `InsufficientTrustForCustomization`.

*   **`setVerifiedStatus(uint256 tokenId, bool verified) external onlyOwner`**:
    *   **Purpose**: Allows the contract owner (Ecosystem) to set the verified status of a badge.
    *   **Logic**: Updates `_badgeData[tokenId].verified`.
    *   **Emits**: `MetadataRefreshed`.

*   **`getBadgeData(uint256 tokenId) external view returns (uint8 badgeType, string memory badgeName, string memory badgeMessage, bool verified)`**:
    *   **Purpose**: Retrieves the `BadgeData` struct for a token.

*   **`refreshTrustScore(uint256 tokenId, address userToRefresh) external`**:
    *   **Purpose**: Updates the `lastTrustScore` for a given `tokenId` based on the current trust score of `userToRefresh`.
    *   **Requires**:
        *   `msg.sender` must be the contract owner (Ecosystem) OR `userToRefresh` (if they own the token).
        *   `tokenId` must exist.
        *   `userToRefresh` must be the owner of `tokenId`.
    *   **Logic**:
        1.  Fetches `trustScoreContract.getTrustScore(userToRefresh)`.
        2.  Updates `lastTrustScore[tokenId]`.
    *   **Emits**: `TrustScoreRefreshed`, `MetadataRefreshed`.
    *   **Reverts**: `TokenDoesNotExist`, `NotTokenOwner`, custom require `Caller not authorized`.

*   **`getTierLevel(uint256 trustScore) public pure returns (uint256 tier)`**:
    *   **Purpose**: Converts a trust score to a tier level (1-5). Mirrors the logic in `GraphiteTrustScoreAdapter`.

*   **`getTierName(uint256 trustScore) public pure returns (string memory tierName)`**:
    *   **Purpose**: Returns the string name for a given tier level.

*   **`getBadgeTypeRequirement(uint8 badgeType) public pure returns (uint256 requiredScore)`**:
    *   **Purpose**: Returns the minimum trust score required to select a given `badgeType`.
    *   **Logic**:
        *   `badgeType <= 2`: 0
        *   `badgeType <= 4`: 200
        *   `badgeType <= 6`: 400
        *   `badgeType <= 8`: 600
        *   `else`: 800

*   **`tokenURI(uint256 tokenId) public view override returns (string memory)`**:
    *   **Purpose**: Generates the metadata URI for a token.
    *   **Logic**: Calls `_buildTokenURI` which constructs a URL using `metadataServer` and various parameters from the token's state (`lastTrustScore`, `_badgeData`, `ownerOf`). This allows for dynamic, off-chain metadata generation.
    *   **Reverts**: `TokenDoesNotExist`.

*   **`setBaseURI(string calldata baseURI_) external onlyOwner`**: Allows owner to update `_customBaseURI`.
*   **`setMetadataServer(string calldata _metadataServer) external onlyOwner`**: Allows owner to update `metadataServer`.
*   **`setTrustScoreContract(address _trustScoreContract) external onlyOwner`**: Allows owner to update the `trustScoreContract` address.

### 3.3. `GraphiteAirdropFactory.sol`

**Source**: `contract/hardhat/contracts/GraphiteAirdropFactory.sol`

**Purpose**: A factory contract for creating and tracking instances of `SybilResistantAirdrop`. It enforces creator eligibility checks (activation and KYC) by directly interacting with Graphite system contracts.

**Inherits**: `Ownable`

#### Key State Variables:
*   `trustScoreContract` (public IGraphiteTrustScore): Address of the trust score adapter.
*   `kycContract` (public IGraphiteKYC): Instance of the Graphite KYC contract (`0x...1001`).
*   `feeContract` (public IGraphiteFee): Instance of the Graphite Fee/Activation contract (`0x...1000`).
*   `KYC_CONTRACT_ADDRESS` (public constant address): `0x0000000000000000000000000000000000001001`.
*   `FEE_CONTRACT_ADDRESS` (public constant address): `0x0000000000000000000000000000000000001000`.
*   `airdrops` (SybilResistantAirdrop[] public): Array storing all created airdrop contract instances.
*   `airdropCreators` (mapping(address => address) public): Maps airdrop contract address to its creator.
*   `creatorAirdrops` (mapping(address => SybilResistantAirdrop[]) public): Maps creator address to an array of their created airdrops.

#### Events:
*   `AirdropCreated(address indexed creator, address indexed tokenAddress, address airdropContract)`

#### Errors:
*   `InvalidTokenAddress()`
*   `InvalidMerkleRoot()`
*   `AccountNotActivated()`
*   `InsufficientKYCLevel()` (for the airdrop creator)

#### Core Functions:

*   **`constructor(address _trustScoreAdapter, address _feeContractAddress)`**:
    *   Initializes owner, `trustScoreContract`.
    *   Initializes `kycContract` with `KYC_CONTRACT_ADDRESS`.
    *   Initializes `feeContract` with `_feeContractAddress` (which should be Graphite's `FEE_CONTRACT_ADDRESS`).

*   **`createAirdrop(address tokenAddress, bytes32 merkleRoot, uint256 requiredTrustScore, uint256 requiredKYCLevel, uint256 startTime, uint256 endTime) external returns (SybilResistantAirdrop newAirdrop)`**:
    *   **Purpose**: Creates and deploys a new `SybilResistantAirdrop` contract instance.
    *   **Logic**:
        1.  Validates `tokenAddress != address(0)` and `merkleRoot != bytes32(0)`.
        2.  **Creator Eligibility Check (Direct Graphite Calls)**:
            *   Calls `feeContract.paidFee(msg.sender)`: Reverts with `AccountNotActivated` if `false`. (Interaction with `0x...1000`)
            *   Calls `kycContract.level(msg.sender)`: Reverts with `InsufficientKYCLevel` if `< 1`. (Interaction with `0x...1001`)
        3.  Deploys a new `SybilResistantAirdrop` contract, passing all constructor arguments.
        4.  Transfers ownership of the `newAirdrop` contract to `msg.sender`.
        5.  Stores the `newAirdrop` address in `airdrops`, `airdropCreators`, and `creatorAirdrops`.
    *   **Emits**: `AirdropCreated`.
    *   **Returns**: Address of the newly created `SybilResistantAirdrop` contract.

*   **`getAllAirdrops() external view returns (SybilResistantAirdrop[] memory)`**: Returns the `airdrops` array.
*   **`getCreatorAirdrops(address creator) external view returns (SybilResistantAirdrop[] memory)`**: Returns airdrops created by a specific `creator`.
*   **`getAirdropCount() external view returns (uint256)`**: Returns `airdrops.length`.
*   **`setTrustScoreContract(address _trustScoreContract) external onlyOwner`**: Updates `trustScoreContract`.
*   **`setActivationContract(address _activationContract) external onlyOwner`**: Updates `feeContract` (this name is a bit misleading, it should be `setFeeContract`).
*   **`getKYCLevel(address user) external view returns (uint256 level)`**:
    *   **Purpose**: View function to check KYC level of any user directly via Graphite's KYC contract.
    *   **Logic**: Returns `kycContract.level(user)`. (Interaction with `0x...1001`)

### 3.4. `SybilResistantAirdrop.sol`

**Source**: `contract/hardhat/contracts/SybilResistantAirdrop.sol`

**Purpose**: An individual airdrop contract instance, created by `GraphiteAirdropFactory`. It manages the distribution of a specific ERC20 token to eligible users based on Merkle proofs, trust scores, KYC levels, and account activation status, verified through direct calls to Graphite system contracts.

**Inherits**: `Ownable`

#### Key State Variables:
*   `KYC_CONTRACT_ADDRESS` (public constant address): `0x0000000000000000000000000000000000001001`.
*   `trustScoreContract` (public IGraphiteTrustScore): Address of the trust score adapter.
*   `feeContract` (public IGraphiteFee): Instance of Graphite's Fee/Activation contract.
*   `kycContract` (public IGraphiteKYC): Instance of Graphite's KYC contract.
*   `token` (public IERC20): The ERC20 token being airdropped.
*   `merkleRoot` (public bytes32): The Merkle root for verifying claims.
*   `requiredTrustScore` (public uint256): Minimum trust score for claimants.
*   `requiredKYCLevel` (public uint256): Minimum KYC level for claimants.
*   `hasClaimed` (mapping(address => bool) public): Tracks if a user has claimed.
*   `blacklisted` (mapping(address => bool) public): Tracks blacklisted users.
*   `startTime` (public uint256): Airdrop start timestamp.
*   `endTime` (public uint256): Airdrop end timestamp.

#### Events:
*   `AirdropClaimed(address indexed user, uint256 amount)`
*   `BlacklistUpdated(address indexed user, bool isBlacklisted)`
*   `RequirementsUpdated(uint256 trustScore, uint256 kycLevel)`
*   `AirdropTimingUpdated(uint256 startTime, uint256 endTime)`

#### Errors:
*   `AirdropNotStarted()`, `AirdropEnded()`, `AlreadyClaimed()`, `AddressBlacklisted()`
*   `NotEligible()`, `InvalidMerkleProof()`, `TransferFailed()`
*   `ArrayLengthMismatch()`, `EndTimeBeforeStartTime()`
*   `NoTokensToWithdraw()`, `AirdropStillInProgress()`

#### Core Functions:

*   **`constructor(address _token, bytes32 _merkleRoot, address _trustScoreContract, address _feeContractAddress, uint256 _requiredTrustScore, uint256 _requiredKYCLevel, uint256 _startTime, uint256 _endTime)`**:
    *   Initializes all state variables based on parameters from the factory.
    *   Sets up `feeContract` with `_feeContractAddress` (Graphite Fee `0x...1000`).
    *   Sets up `kycContract` with `KYC_CONTRACT_ADDRESS` (`0x...1001`).
    *   Validates `_endTime > _startTime` if both are non-zero.
    *   Sets default start/end times if `_startTime` or `_endTime` are zero.
    *   Ownership is typically transferred by the factory *after* deployment.

*   **`claim(uint256 amount, bytes32[] calldata proof) external`**:
    *   **Purpose**: Allows a user to claim their airdropped tokens.
    *   **Logic**:
        1.  Checks airdrop timing (`startTime`, `endTime`), `hasClaimed[msg.sender]`, `blacklisted[msg.sender]`.
        2.  Calls `isEligible(msg.sender)` to verify claimant's status (see below). Reverts with `NotEligible` if false.
        3.  Verifies the `proof` against `merkleRoot` and `keccak256(abi.encodePacked(msg.sender, amount))`. Reverts with `InvalidMerkleProof` on failure.
        4.  Sets `hasClaimed[msg.sender] = true`.
        5.  Transfers `amount` of `token` to `msg.sender`. Reverts with `TransferFailed` on failure.
    *   **Emits**: `AirdropClaimed`.

*   **`isEligible(address user) public view returns (bool eligible)`**:
    *   **Purpose**: Checks if a user meets all criteria to claim the airdrop.
    *   **Logic (Direct Graphite Calls)**:
        1.  Checks activation: `!feeContract.paidFee(user)` -> return `false`. (Interaction with Graphite Fee `0x...1000`)
        2.  Checks KYC: `kycContract.level(user) < requiredKYCLevel` -> return `false`. (Interaction with Graphite KYC `0x...1001`)
        3.  Checks Trust Score: `trustScoreContract.getTrustScore(user) < requiredTrustScore` -> return `false`.
        4.  If all pass, returns `true`.

*   **`getEligibilityDetails(address user) external view returns (bool isActivated, uint256 trustScore, uint256 kycLevel, bool isBlacklisted, bool hasClaimedAirdrop)`**:
    *   **Purpose**: Provides a detailed breakdown of a user's eligibility status.
    *   **Logic (Direct Graphite Calls)**:
        *   `isActivated = feeContract.paidFee(user)` (Graphite Fee `0x...1000`)
        *   `trustScore = trustScoreContract.getTrustScore(user)`
        *   `kycLevel = kycContract.level(user)` (Graphite KYC `0x...1001`)
        *   `isBlacklisted = blacklisted[user]`
        *   `hasClaimedAirdrop = hasClaimed[user]`

*   **`setBlacklist(address user, bool isBlacklisted) external onlyOwner`**: Updates blacklist status.
*   **`batchSetBlacklist(address[] calldata users, bool[] calldata statuses) external onlyOwner`**: Batch update blacklist.
*   **`updateRequirements(uint256 _trustScore, uint256 _kycLevel) external onlyOwner`**: Updates airdrop requirements.
*   **`updateMerkleRoot(bytes32 _merkleRoot) external onlyOwner`**: Updates Merkle root.
*   **`updateAirdropTiming(uint256 _startTime, uint256 _endTime) external onlyOwner`**: Updates airdrop timing.
*   **`withdrawTokens(address _token) external onlyOwner`**: Allows owner to withdraw accidentally sent tokens. If withdrawing the airdrop token, checks that `block.timestamp > endTime`.

### 3.5. `GraphiteReputationEcosystem.sol`

**Source**: `contract/hardhat/contracts/GraphiteReputationEcosystem.sol` (or `contract/src/GraphiteReputationEcosystem.sol`)

**Purpose**: The central orchestrator contract for the ecosystem. It manages NFT minting, account activation, provides aggregated user information by interacting with other ecosystem contracts and Graphite's system contracts directly. This contract typically owns the `GraphiteTrustNFT` contract.

**Inherits**: `Ownable`

#### Key State Variables:
*   `airdropFactory` (public IGraphiteAirdropFactory): Address of the `GraphiteAirdropFactory`.
*   `trustNFT` (public IGraphiteTrustNFT): Address of the `GraphiteTrustNFT` contract.
*   `trustScoreContract` (public IGraphiteTrustScore): Address of the trust score adapter.
*   `mintCost` (public uint256): Cost to mint an NFT.
*   `mintingEnabled` (public bool): Flag to enable/disable NFT minting.
*   `KYC_CONTRACT_ADDRESS`, `FEE_CONTRACT_ADDRESS`, `REPUTATION_CONTRACT_ADDRESS`, `FILTER_CONTRACT_ADDRESS` (public constant address): Fixed addresses of Graphite system contracts.
*   `kycContract` (private IGraphiteKYC): Instance of Graphite KYC contract.
*   `feeContract` (private IGraphiteFee): Instance of Graphite Fee/Activation contract.
*   `reputationContract` (private IGraphiteReputation): Instance of Graphite Reputation contract.
*   `filterContract` (private IGraphiteFilter): Instance of Graphite Filter contract.

#### Events:
*   `AccountActivated(address indexed user, uint256 feePaid)`
*   `NFTMinted(address indexed minter, uint256 indexed tokenId, uint256 mintCostPaid)`
*   `TrustScoreRefreshed(address indexed user, uint256 indexed tokenId, uint256 newScore)`
*   `KYCFilterSet(uint256 newLevel)` (Note: This implies the ecosystem sets a global filter, or it might be intended per user via Graphite's Filter contract; the name `setKYCFilter` takes a level but doesn't specify for whom, suggesting a global setting for the ecosystem or a misinterpretation of Graphite's filter which is user-settable for *their* incoming transactions). **Correction**: Graphite's `FilterContract` (`0x...1002`) allows users to set *their own* filter level for transactions *they receive*. The `setKYCFilter` in the ecosystem seems to be for the ecosystem to enforce a minimum KYC level for *its interactions* rather than setting a user's filter on the Graphite system. The `GraphiteReputationEcosystem` does not seem to have a `kycFilterLevel` storage variable, this function directly calls `filterContract.setFilterLevel(level)` which would make the *ecosystem contract itself* set its own incoming transaction filter level on Graphite. This is likely not the intended use if the goal is to check a user's KYC against a general requirement. The `mintNFT` function's KYC check makes more sense: `kycContract.level(msg.sender) >= filterContract.viewFilterLevel()` which implies the ecosystem reads its own filter level set previously by its owner.
*   `MintCostUpdated(uint256 newCost)`
*   `MintingStatusUpdated(bool isEnabled)`

#### Errors:
*   `MintingDisabled()`
*   `InsufficientMintFee()`
*   `AccountNotActivated()`
*   `InsufficientKYCLevel()`
*   `NotNFTOwner()`
*   `ContractCallFailed()` (Generic error for failed internal calls to Graphite system contracts)

#### Core Functions:

*   **`constructor(address _airdropFactory, address _trustNFT, address _trustScoreContract, uint256 _mintCost)`**:
    *   Initializes owner and all contract addresses.
    *   Sets up instances for `kycContract`, `feeContract`, `reputationContract`, `filterContract` using the constant addresses.
    *   Sets `mintCost` and `mintingEnabled = true`.

*   **`activateAccount() external payable`**:
    *   **Purpose**: Allows a user to activate their account on the Graphite network by paying the required fee through this ecosystem contract.
    *   **Logic (Direct Graphite Call)**:
        1.  Calls `feeContract.pay{value: msg.value}()`. (Interaction with Graphite Fee `0x...1000`)
            *   `msg.value` is forwarded. Graphite's `pay()` checks `msg.value >= initialFee` and if `paidFee[sender]` is false.
    *   **Emits**: `AccountActivated` (with `msg.value` as `feePaid`).
    *   **Reverts**: If `feeContract.pay()` reverts (e.g., "G000": already paid, "G001": insufficient fee). Bubbles up as `ContractCallFailed` or the specific Graphite error.

*   **`mintNFT() external payable`**:
    *   **Purpose**: Mints a new `GraphiteTrustNFT` for the `msg.sender`.
    *   **Requires**: `mintingEnabled == true`, `msg.value == mintCost`.
    *   **Logic (Direct Graphite Calls & Internal Calls)**:
        1.  Checks `mintingEnabled` and `msg.value`.
        2.  **Activation Check**: Calls `feeContract.paidFee(msg.sender)`. Reverts with `AccountNotActivated` if false. (Interaction with Graphite Fee `0x...1000`)
        3.  **KYC Check**:
            *   Calls `filterContract.viewFilterLevel()` to get the ecosystem's required KYC filter level. (Interaction with Graphite Filter `0x...1002`)
            *   Calls `kycContract.level(msg.sender)` to get user's KYC level. (Interaction with Graphite KYC `0x...1001`)
            *   Reverts with `InsufficientKYCLevel` if `userKYCLevel < ecosystemFilterLevel`.
        4.  Calls `trustNFT.mint(msg.sender)`.
    *   **Emits**: `NFTMinted`.
    *   **Reverts**: `MintingDisabled`, `InsufficientMintFee`, `AccountNotActivated`, `InsufficientKYCLevel`.

*   **`getUserDetails(address user, address airdropAddress) external view returns (UserDetails memory)`**:
    *   **Purpose**: Aggregates and returns comprehensive details about a user.
    *   **Logic (Direct Graphite Calls & Internal Calls)**:
        *   `trustScore = trustScoreContract.getTrustScore(user)`
        *   `tierName = trustNFT.getTierName(trustScore)`
        *   `tierLvl = trustNFT.getTierLevel(trustScore)`
        *   `rawReputation = reputationContract.getReputation(user)` (Graphite Reputation `0x...1008`)
        *   `activated = feeContract.paidFee(user)` (Graphite Fee `0x...1000`)
        *   `kycLvl = kycContract.level(user)` (Graphite KYC `0x...1001`)
        *   `ecosystemKYCFilter = filterContract.viewFilterLevel()` (Graphite Filter `0x...1002` - this ecosystem's own incoming filter level)
        *   If `airdropAddress != address(0)`:
            *   `eligible = SybilResistantAirdrop(airdropAddress).isEligible(user)`
            *   `claimed = SybilResistantAirdrop(airdropAddress).hasClaimed(user)`
    *   **Returns**: A `UserDetails` struct.

*   **`refreshNFTTrustScore(uint256 tokenId) external`**:
    *   **Purpose**: Allows a user to refresh the trust score stored on their NFT.
    *   **Requires**: `msg.sender` must own `tokenId`.
    *   **Logic (Direct Graphite Calls & Internal Calls)**:
        1.  Verifies `trustNFT.ownerOf(tokenId) == msg.sender`.
        2.  **Activation Check**: `feeContract.paidFee(msg.sender)`. Reverts `AccountNotActivated`. (Graphite Fee `0x...1000`)
        3.  **KYC Check**: `kycContract.level(msg.sender) >= filterContract.viewFilterLevel()`. Reverts `InsufficientKYCLevel`. (Graphite KYC `0x...1001`, Graphite Filter `0x...1002`)
        4.  Calls `trustNFT.refreshTrustScore(tokenId, msg.sender)`. The score fetched internally by `trustNFT` comes from `trustScoreContract`.
    *   **Emits**: `TrustScoreRefreshed`.
    *   **Reverts**: `NotNFTOwner`, `AccountNotActivated`, `InsufficientKYCLevel`.

*   **`getKYCLevel(address user) external view returns (uint256)`**:
    *   **Logic**: Returns `kycContract.level(user)`. (Interaction with Graphite KYC `0x...1001`)

*   **`getReputationScore(address user) external view returns (uint256)`**:
    *   **Logic**: Returns `reputationContract.getReputation(user)`. (Interaction with Graphite Reputation `0x...1008`)

*   **`isTransactionAllowed(address sender, address recipient) external view returns (bool)`**:
    *   **Logic**: Returns `filterContract.filter(sender, recipient)`. (Interaction with Graphite Filter `0x...1002`)
        *   Note: This checks if `sender`'s KYC level is `>=` `recipient`'s self-set filter level on Graphite.

*   **`setKYCFilter(uint256 level) external onlyOwner`**:
    *   **Purpose**: Allows the ecosystem owner to set the *ecosystem contract's own* incoming transaction filter level on Graphite.
    *   **Logic**: Calls `filterContract.setFilterLevel(level)`. (Interaction with Graphite Filter `0x...1002`)
    *   **Emits**: `KYCFilterSet`.

*   **Owner Functions**: `setMintCost`, `toggleMinting`, `setAirdropFactory`, `setTrustNFT`, `setTrustScoreContract`, `withdraw`.

## 4. Interactions and Data Flow Summary

1.  **User Activation**:
    *   User calls `GraphiteReputationEcosystem.activateAccount()` (payable).
    *   Ecosystem calls Graphite Fee Contract (`0x...1000`) `pay{value: msg.value}()`.

2.  **NFT Minting**:
    *   User calls `GraphiteReputationEcosystem.mintNFT()` (payable with `mintCost`).
    *   Ecosystem checks:
        *   Graphite Fee Contract (`0x...1000`) `paidFee(user)`.
        *   Graphite KYC Contract (`0x...1001`) `level(user)` against Graphite Filter Contract (`0x...1002`) `viewFilterLevel()` (ecosystem's own filter).
    *   Ecosystem calls `GraphiteTrustNFT.mint(user)`.
    *   `GraphiteTrustNFT` calls `GraphiteTrustScoreAdapter.getTrustScore(user)` for initial score.
    *   `GraphiteTrustScoreAdapter` calls Graphite Reputation Contract (`0x...1008`) `getReputation(user)`.

3.  **Airdrop Creation**:
    *   Creator calls `GraphiteAirdropFactory.createAirdrop(...)`.
    *   Factory checks creator:
        *   Graphite Fee Contract (`0x...1000`) `paidFee(creator)`.
        *   Graphite KYC Contract (`0x...1001`) `level(creator)`.
    *   Factory deploys `SybilResistantAirdrop` instance.

4.  **Airdrop Claim**:
    *   User calls `SybilResistantAirdrop.claim(amount, proof)`.
    *   Airdrop instance calls its own `isEligible(user)`:
        *   Checks Graphite Fee Contract (`0x...1000`) `paidFee(user)`.
        *   Checks Graphite KYC Contract (`0x...1001`) `level(user)` against `requiredKYCLevel`.
        *   Checks `GraphiteTrustScoreAdapter.getTrustScore(user)` against `requiredTrustScore`.
            *   Adapter calls Graphite Reputation (`0x...1008`) `getReputation(user)`.

5.  **Fetching User Details**:
    *   Frontend calls `GraphiteReputationEcosystem.getUserDetails(user, airdropAddr)`.
    *   Ecosystem makes multiple calls: `GraphiteTrustScoreAdapter`, `GraphiteTrustNFT`, Graphite System Contracts (Reputation, Fee, KYC, Filter), and optionally `SybilResistantAirdrop` instance.

## 5. Voting System Contracts

The voting system allows users to create and participate in on-chain polls where eligibility to vote can be defined by specific criteria including Graphite account activation, KYC level, Trust Score, and ERC20 token holdings.

### 5.1. `GraphiteVoteFactory.sol`

**Source**: `contract/hardhat/contracts/GraphiteVoteFactory.sol`

**Purpose**: A factory contract responsible for creating and tracking instances of `GraphiteVote`. It also enforces eligibility criteria (Graphite account activation and minimum KYC level) for users who want to create new voting proposals.

**Inherits**: `Ownable`

#### Key State Variables:
*   `trustScoreContractAddress` (public immutable address): The address of the `IGraphiteTrustScore` compatible contract (e.g., `GraphiteTrustScoreAdapter` or `TestAdapter`) used to fetch trust scores.
*   `kycContract` (public constant IGraphiteKYC): Instance of the official Graphite KYC contract, fixed at `0x0000000000000000000000000000000000001001`.
*   `feeContract` (public constant IGraphiteFee): Instance of the official Graphite Fee/Activation contract, fixed at `0x0000000000000000000000000000000000001000`.
*   `voteContracts` (address[] public): An array storing the addresses of all deployed `GraphiteVote` contract instances.
*   `creatorMinimumKYCLevel` (uint256 public): The minimum Graphite KYC level a user must possess to be eligible to create a new vote. Defaults to 1.

#### Events:
*   `VoteCreated(address indexed creator, address indexed voteContract, string description, uint256 requiredTrustScore, uint256 requiredKYCLevelForVoter)`: Emitted when a new `GraphiteVote` contract is successfully created.
    *   `creator`: The address of the user who created the vote.
    *   `voteContract`: The address of the newly deployed `GraphiteVote` contract.
    *   `description`: The description of the created vote.
    *   `requiredTrustScore`: The trust score required for voters in the created vote.
    *   `requiredKYCLevelForVoter`: The KYC level required for voters in the created vote.

#### Errors:
*   `CreatorNotActivated()`: Reverts if the `msg.sender` (vote creator) has not activated their Graphite account.
*   `CreatorInsufficientKYC()`: Reverts if the `msg.sender` (vote creator) does not meet the `creatorMinimumKYCLevel`.
*   `InvalidOptions()`: Reverts if the provided `options` array for a new vote is empty.
*   `InvalidTimeSettings()`: Reverts if `startTime` is greater than or equal to `endTime`, and `endTime` is not zero (0 for indefinite).
*   `InvalidTrustScoreContract()`: Reverts if the `_trustScoreContractAddress` provided in the constructor is the zero address.

#### Core Functions:

*   **`constructor(address _trustScoreContractAddress)`**:
    *   **Purpose**: Initializes the factory contract.
    *   **Parameters**:
        *   `_trustScoreContractAddress` (address): The address of the `IGraphiteTrustScore` contract.
    *   **Logic**:
        1.  Validates `_trustScoreContractAddress` is not the zero address.
        2.  Sets `trustScoreContractAddress`.
        3.  Sets `creatorMinimumKYCLevel` to a default of 1.
        4.  Transfers ownership of the factory to `msg.sender` (the deployer).
    *   **Reverts**: `InvalidTrustScoreContract`.

*   **`createVote(string calldata description, string[] calldata options, uint256 startTime, uint256 endTime, address requiredTokenAddress, uint256 requiredTokenBalance, uint256 requiredTrustScoreForVoter, uint256 requiredKYCLevelForVoter) external returns (address voteContractAddress)`**:
    *   **Purpose**: Allows an eligible user to create and deploy a new `GraphiteVote` contract instance.
    *   **Parameters**:
        *   `description` (string calldata): The textual description of the vote.
        *   `options` (string[] calldata): An array of strings representing the choices for the vote.
        *   `startTime` (uint256): Unix timestamp for when voting begins.
        *   `endTime` (uint256): Unix timestamp for when voting ends. A value of 0 means the vote runs indefinitely.
        *   `requiredTokenAddress` (address): Address of the ERC20 token required for voting eligibility. `address(0)` if no token is required.
        *   `requiredTokenBalance` (uint256): Minimum balance of `requiredTokenAddress` a voter must hold.
        *   `requiredTrustScoreForVoter` (uint256): Minimum Graphite Trust Score a voter must have.
        *   `requiredKYCLevelForVoter` (uint256): Minimum Graphite KYC level a voter must possess.
    *   **Logic**:
        1.  **Creator Eligibility Check (Direct Graphite Calls)**:
            *   Calls `feeContract.paidFee(msg.sender)`: Reverts with `CreatorNotActivated` if `false`. (Interaction with Graphite Fee `0x...1000`)
            *   Calls `kycContract.level(msg.sender)`: Reverts with `CreatorInsufficientKYC` if the level is less than `creatorMinimumKYCLevel`. (Interaction with Graphite KYC `0x...1001`)
        2.  Validates `options.length > 0`. Reverts with `InvalidOptions` if false.
        3.  Validates `startTime < endTime` or `endTime == 0`. Reverts with `InvalidTimeSettings` if false.
        4.  Deploys a new `GraphiteVote` contract, passing all constructor arguments including `msg.sender` as `_proposalCreator`.
        5.  Transfers ownership of the newly deployed `GraphiteVote` contract to `msg.sender` (the vote creator).
        6.  Stores the `voteContractAddress` in the `voteContracts` array.
    *   **Emits**: `VoteCreated`.
    *   **Returns**: The address of the newly deployed `GraphiteVote` contract.
    *   **Reverts**: `CreatorNotActivated`, `CreatorInsufficientKYC`, `InvalidOptions`, `InvalidTimeSettings`.

*   **`setCreatorMinimumKYCLevel(uint256 _level) external onlyOwner`**:
    *   **Purpose**: Allows the factory owner to update the minimum KYC level required for users to create votes.
    *   **Parameters**:
        *   `_level` (uint256): The new minimum KYC level.

*   **`getVoteContractsCount() external view returns (uint256)`**:
    *   **Purpose**: Returns the total number of vote contracts created by this factory.

*   **`getVoteContractAtIndex(uint256 index) external view returns (address)`**:
    *   **Purpose**: Returns the address of the vote contract at a specific index in the `voteContracts` array.
    *   **Parameters**:
        *   `index` (uint256): The index to query.

### 5.2. `GraphiteVote.sol`

**Source**: `contract/hardhat/contracts/GraphiteVote.sol`

**Purpose**: Represents a single, individual voting proposal. It manages the proposal's details, voting options, eligibility rules for voters, and the tally of votes. Each instance is created by `GraphiteVoteFactory` and owned by its creator.

**Inherits**: `Ownable`

#### Key State Variables:
*   `description` (string public): The textual description of the vote. Set at creation.
*   `options` (string[] public): An array of strings representing the distinct choices for the vote (e.g., `["Yes", "No"]`). Set at creation.
*   `startTime` (uint256 public immutable): Unix timestamp indicating when voting begins.
*   `endTime` (uint256 public immutable): Unix timestamp indicating when voting ends. If 0, voting is indefinite.
*   `trustScoreContract` (IGraphiteTrustScore public immutable): Address of the `IGraphiteTrustScore` contract used for voter eligibility.
*   `kycContract` (IGraphiteKYC public immutable): Address of the `IGraphiteKYC` contract used for voter eligibility.
*   `feeContract` (IGraphiteFee public immutable): Address of the `IGraphiteFee` contract used for voter activation checks.
*   `requiredToken` (IERC20 public immutable): Address of an ERC20 token voters might need to hold. `address(0)` if no token is required.
*   `requiredTokenBalance` (uint256 public immutable): The minimum balance of `requiredToken` a voter must hold.
*   `requiredTrustScore` (uint256 public immutable): The minimum Graphite Trust Score a voter must have.
*   `requiredKYCLevel` (uint256 public immutable): The minimum Graphite KYC level a voter must possess.
*   `votesPerOption` (mapping(uint256 => uint256) public): Maps an option's index to its total vote count.
*   `hasVoted` (mapping(address => bool) public): Tracks if an address has already voted in this proposal.
*   `totalVotesCasted` (uint256 public): The total number of votes cast in this proposal.
*   `proposalCreator` (address public immutable): The address that created this voting proposal.

#### Events:
*   `Voted(address indexed voter, uint256 optionIndex)`: Emitted when a user successfully casts a vote.
    *   `voter`: The address of the user who voted.
    *   `optionIndex`: The index of the option the user voted for.

#### Errors:
*   `VoteNotActive()`: Reverts if a vote is attempted before `startTime`.
*   `VoteEnded()`: Reverts if a vote is attempted after `endTime` (and `endTime` is not 0).
*   `AlreadyVoted()`: Reverts if a user tries to vote more than once.
*   `NotEligibleToVote(string reason)`: Reverts if a user does not meet the voting eligibility criteria. The `reason` string provides more details.
*   `InvalidOption()`: Reverts if a vote is cast for an option index that is out of bounds for the `options` array.

#### Core Functions:

*   **`constructor(string memory _description, string[] memory _options, uint256 _startTime, uint256 _endTime, address _trustScoreContractAddress, address _kycContractAddress, address _feeContractAddress, address _requiredTokenAddress, uint256 _requiredTokenBalance, uint256 _requiredTrustScore, uint256 _requiredKYCLevel, address _proposalCreator)`**:
    *   **Purpose**: Initializes a new voting proposal instance. Called by `GraphiteVoteFactory`.
    *   **Parameters**:
        *   `_description` (string memory): Proposal description.
        *   `_options` (string[] memory): Array of vote choices.
        *   `_startTime` (uint256): Voting start time.
        *   `_endTime` (uint256): Voting end time (0 for indefinite).
        *   `_trustScoreContractAddress` (address): Address of the trust score contract.
        *   `_kycContractAddress` (address): Address of the KYC contract.
        *   `_feeContractAddress` (address): Address of the Fee/Activation contract.
        *   `_requiredTokenAddress` (address): ERC20 token for eligibility, or `address(0)`.
        *   `_requiredTokenBalance` (uint256): Minimum balance for token eligibility.
        *   `_requiredTrustScore` (uint256): Minimum trust score for eligibility.
        *   `_requiredKYCLevel` (uint256): Minimum KYC level for eligibility.
        *   `_proposalCreator` (address): Address of the user creating the proposal.
    *   **Logic**:
        1.  Validates `_startTime < _endTime` (if `_endTime != 0`) and `_options.length > 0`.
        2.  Sets all immutable and public state variables based on the provided parameters.
    *   **Note**: Ownership is transferred to `_proposalCreator` by the factory immediately after deployment.

*   **`vote(uint256 optionIndex) external`**:
    *   **Purpose**: Allows an eligible user to cast their vote.
    *   **Parameters**:
        *   `optionIndex` (uint256): The index of the chosen option from the `options` array.
    *   **Logic**:
        1.  Checks if voting is active (current time is between `startTime` and `endTime`).
        2.  Checks if `msg.sender` has already voted.
        3.  Checks if `optionIndex` is valid.
        4.  Calls internal `_checkEligibility(msg.sender)` to verify voter eligibility.
        5.  Increments `votesPerOption[optionIndex]`.
        6.  Sets `hasVoted[msg.sender] = true`.
        7.  Increments `totalVotesCasted`.
    *   **Emits**: `Voted`.
    *   **Reverts**: `VoteNotActive`, `VoteEnded`, `AlreadyVoted`, `InvalidOption`, or `NotEligibleToVote` (from `_checkEligibility`).

*   **`_checkEligibility(address user) internal view`**:
    *   **Purpose**: Internal function to verify if a user meets all eligibility criteria to vote.
    *   **Parameters**:
        *   `user` (address): The address of the user to check.
    *   **Logic (Direct Graphite & Token Calls)**:
        1.  **Graphite Account Activation**: Checks `!feeContract.paidFee(user)`. Reverts with `NotEligibleToVote("User account not activated on Graphite.")` if not activated.
        2.  **KYC Level**: Checks `kycContract.level(user) < requiredKYCLevel`. Reverts with `NotEligibleToVote("User KYC level too low.")` if insufficient.
        3.  **Trust Score**: Checks `trustScoreContract.getTrustScore(user) < requiredTrustScore`. Reverts with `NotEligibleToVote("User trust score too low.")` if insufficient.
        4.  **Token Balance**: If `requiredToken != address(0)`, checks `requiredToken.balanceOf(user) < requiredTokenBalance`. Reverts with `NotEligibleToVote("User token balance too low.")` if insufficient.

*   **`canVote(address user) external view returns (bool)`**:
    *   **Purpose**: A view function to check if a user is currently eligible to vote without causing a revert if they are not.
    *   **Parameters**:
        *   `user` (address): The address to check.
    *   **Logic**:
        1.  Checks basic conditions: vote active (time), not already voted.
        2.  Directly performs all eligibility checks from `_checkEligibility` but returns `false` on any failure instead of reverting.
    *   **Returns**: `true` if the user can vote, `false` otherwise.

*   **`getEligibilityDetails(address user) external view returns (bool isActiveOnGraphite, uint256 userKycLevel, uint256 userTrustScore, uint256 userTokenBalance, bool meetsAllRequirements, string memory ineligibleReason)`**:
    *   **Purpose**: Provides a detailed breakdown of a user's eligibility status and the reason if not eligible.
    *   **Parameters**:
        *   `user` (address): The address to check.
    *   **Logic (Direct Graphite & Token Calls)**:
        *   Fetches `isActiveOnGraphite` from `feeContract.paidFee(user)`.
        *   Fetches `userKycLevel` from `kycContract.level(user)`.
        *   Fetches `userTrustScore` from `trustScoreContract.getTrustScore(user)`.
        *   Fetches `userTokenBalance` from `requiredToken.balanceOf(user)` if `requiredToken` is set.
        *   Sequentially checks each requirement and sets `meetsAllRequirements` and `ineligibleReason` accordingly.
    *   **Returns**: A tuple containing the detailed eligibility status.

*   **`getVoteCount(uint256 optionIndex) external view returns (uint256)`**:
    *   **Purpose**: Returns the number of votes received for a specific option.
    *   **Parameters**:
        *   `optionIndex` (uint256): The index of the option.
    *   **Returns**: The vote count for that option.
    *   **Reverts**: `InvalidOption` if `optionIndex` is out of bounds.

This refactored architecture ensures that all checks against Graphite's core systems (Activation, KYC, Reputation, Filtering) are done by directly querying the authoritative Graphite system contracts, enhancing the reliability and directness of these interactions. The adapter pattern is maintained for converting Graphite's reputation score into the ecosystem's specific trust score and tiering model.

## Conclusion

The Graphite Trust NFT System creates a comprehensive reputation-based ecosystem by leveraging Graphite's native capabilities through an adapter pattern. This architecture allows for dynamic trust badges that evolve with user reputation while providing sybil resistance for token distributions." 