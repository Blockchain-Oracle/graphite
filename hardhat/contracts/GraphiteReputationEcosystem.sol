// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SybilResistantAirdrop} from "./SybilResistantAirdrop.sol";
import {GraphiteTrustNFT} from "./GraphiteTrustNFT.sol";
import {IGraphiteTrustScore} from "./interfaces/IGraphiteTrustScore.sol";
import {IGraphiteFee} from "./interfaces/IGraphiteFee.sol";
import {IGraphiteFilter} from "./interfaces/IGraphiteFilter.sol";
import {IGraphiteReputation} from "./interfaces/IGraphiteReputation.sol";
import {IGraphiteKYC} from "./interfaces/IGraphiteKYC.sol";
import {GraphiteAirdropFactory} from "./GraphiteAirdropFactory.sol";

/**
 * @title GraphiteReputationEcosystem
 * @dev Contract that integrates Graphite airdrops and dynamic NFTs for a complete trust-based ecosystem
 *      Simplified version for easier integration in hackathon projects
 */
contract GraphiteReputationEcosystem is Ownable {
    // Component contracts
    GraphiteAirdropFactory public airdropFactory;
    GraphiteTrustNFT public trustNFT;
    
    // Graphite system contracts
    IGraphiteTrustScore public trustScoreContract;
    IGraphiteFee public feeContract;
    IGraphiteFilter public filterContract;
    IGraphiteReputation public reputationContract;
    IGraphiteKYC public kycContract;
    
    // Graphite system contract addresses
    address public constant FILTER_CONTRACT_ADDRESS = 0x0000000000000000000000000000000000001002;
    address public constant FEE_CONTRACT_ADDRESS = 0x0000000000000000000000000000000000001000;
    address public constant REPUTATION_CONTRACT_ADDRESS = 0x0000000000000000000000000000000000001008;
    address public constant KYC_CONTRACT_ADDRESS = 0x0000000000000000000000000000000000001001;
    
    // Configurable parameters
    uint256 public mintCost; // Cost to mint an NFT (in native currency)
    bool public mintingEnabled = true;
    
    // Events
    event NFTMinted(address indexed user, uint256 indexed tokenId, uint256 initialScore);
    event NFTTrustScoreRefreshed(uint256 indexed tokenId, uint256 newScore);
    event AirdropClaimed(address indexed user, address indexed airdropAddress, uint256 amount);
    event MintingDisabledByOwner();
    event MintingEnabledByOwner();
    event MintCostUpdated(uint256 newCost);
    event AccountActivated(address indexed user);
    event KYCFilterSet(address indexed setter, uint256 newLevel);
    
    // Errors
    error MintingDisabled();
    error InsufficientMintFee();
    error WithdrawalFailed();
    error TransferFailed();
    error ContractCallFailed();
    error AccountNotActivated();
    error InsufficientKYCLevel();
    
    /**
     * @dev Constructor sets up the ecosystem contract
     * @param _airdropFactory Address of the GraphiteAirdropFactory contract
     * @param _trustNFT Address of the GraphiteTrustNFT contract
     * @param _trustScoreAdapter Address of the Graphite Trust Score contract
     * @param _mintCost Initial cost to mint an NFT (in wei)
     */
    constructor(
        address _airdropFactory,
        address _trustNFT,
        address _trustScoreAdapter,
        uint256 _mintCost
    ) Ownable() {
        airdropFactory = GraphiteAirdropFactory(_airdropFactory);
        trustNFT = GraphiteTrustNFT(_trustNFT);
        trustScoreContract = IGraphiteTrustScore(_trustScoreAdapter);
        
        filterContract = IGraphiteFilter(FILTER_CONTRACT_ADDRESS);
        feeContract = IGraphiteFee(FEE_CONTRACT_ADDRESS);
        reputationContract = IGraphiteReputation(REPUTATION_CONTRACT_ADDRESS);
        kycContract = IGraphiteKYC(KYC_CONTRACT_ADDRESS);
        
        mintCost = _mintCost;
    }
    
    /**
     * @dev Activate the caller's account by paying the activation fee
     */
    function activateAccount() external payable {
        try feeContract.pay{value: msg.value}() {
            emit AccountActivated(msg.sender);
        } catch {
            revert ContractCallFailed();
        }
    }
    
    /**
     * @dev Set the KYC filter level for the caller
     * @param level The KYC filter level to set
     */
    function setKYCFilter(uint256 level) external onlyOwner {
        filterContract.setFilterLevel(level);
        emit KYCFilterSet(msg.sender, level);
    }
    
    /**
     * @dev Get the KYC level of an address
     * @param user The address to check
     * @return kyc The KYC level
     */
    function getKYCLevel(address user) external view returns (uint256 kyc) {
        return kycContract.level(user);
    }
    
    /**
     * @dev Get the reputation score for an address
     * @param user Address to check
     * @return score The reputation score
     */
    function getReputationScore(address user) external view returns (uint256 score) {
        return reputationContract.getReputation(user);
    }
    
    /**
     * @dev Check if a transaction between two addresses would be allowed by KYC filters
     * @param sender Sender address
     * @param recipient Recipient address
     * @return allowed Whether the transaction would be allowed
     */
    function isTransactionAllowed(address sender, address recipient) external view returns (bool allowed) {
        return filterContract.filter(sender, recipient);
    }
    
    /**
     * @dev Mint a dynamic NFT that evolves with trust score
     * @notice No trust score checks for simplified version
     */
    function mintNFT() external payable {
        if (!mintingEnabled) revert MintingDisabled();
        if (msg.value < mintCost) revert InsufficientMintFee();
        
        if (!feeContract.paidFee(msg.sender)) revert AccountNotActivated();
        if (kycContract.level(msg.sender) < filterContract.viewFilterLevel()) revert InsufficientKYCLevel();
        
        trustNFT.mint{value: 0}(msg.sender);
        uint256 newId = trustNFT.totalSupply();
        uint256 initialScore = trustNFT.lastTrustScore(newId);
        emit NFTMinted(msg.sender, newId, initialScore);
        
        if (msg.value > mintCost) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - mintCost}("");
            if (!success) revert TransferFailed();
        }
    }
    
    /**
     * @dev Allow a user to refresh their NFT's trust score
     * @param tokenId The token ID to refresh
     */
    function refreshNFTTrustScore(uint256 tokenId) external {
        if (!feeContract.paidFee(msg.sender)) revert AccountNotActivated(); 
        if (kycContract.level(msg.sender) < filterContract.viewFilterLevel()) revert InsufficientKYCLevel();

        trustNFT.refreshTrustScore(tokenId, msg.sender);
        uint256 newScore = trustNFT.lastTrustScore(tokenId);
        emit NFTTrustScoreRefreshed(tokenId, newScore);
    }
    
    /**
     * @dev Claim tokens from a specific airdrop
     * @param airdropAddress Address of the SybilResistantAirdrop contract
     * @param merkleProof Merkle proof for the claim
     * @param amount Amount of tokens to claim
     */
    function claimAirdrop(address airdropAddress, bytes32[] calldata merkleProof, uint256 amount) external {
        if (!feeContract.paidFee(msg.sender)) revert AccountNotActivated();
        if (kycContract.level(msg.sender) < filterContract.viewFilterLevel()) revert InsufficientKYCLevel();

        SybilResistantAirdrop airdrop = SybilResistantAirdrop(airdropAddress);
        airdrop.claim(amount, merkleProof);
        emit AirdropClaimed(msg.sender, airdropAddress, amount);
    }
    
    /**
     * @dev Check if a user has claimed an airdrop
     * @param user Address to check
     * @param airdropAddress Address of the airdrop contract
     * @return hasClaimedAirdrop Whether the user has claimed the airdrop
     */
    function checkAirdropClaimed(address user, address airdropAddress) public view returns (bool hasClaimedAirdrop) {
        if (airdropAddress == address(0)) {
            return false;
        }
        
        SybilResistantAirdrop airdrop = SybilResistantAirdrop(airdropAddress);
        return airdrop.hasClaimed(user);
    }
    
    /**
     * @dev Get a user's trust score details and NFT status
     * @param user Address to check
     * @param airdropAddress Optional address of specific airdrop to check eligibility for
     * @return trustScore User's trust score
     * @return trustTier User's trust tier name
     * @return tierLevel User's trust tier level (1-5)
     * @return eligibleForAirdrop Whether user is eligible for specific airdrop (or general minimum if no address provided)
     * @return hasClaimedAirdrop Whether user has claimed the specific airdrop (always false if no address provided)
     * @return reputationScore User's overall reputation score
     * @return isActivated Whether the user's account is activated
     * @return kycLevel User's KYC level
     * @return kycFilterLevel User's KYC filter level for incoming transactions
     */
    function getUserDetails(address user, address airdropAddress) external view returns (
        uint256 trustScore,
        string memory trustTier,
        uint256 tierLevel,
        bool eligibleForAirdrop,
        bool hasClaimedAirdrop,
        uint256 reputationScore,
        bool isActivated,
        uint256 kycLevel,
        uint256 kycFilterLevel
    ) {
        trustScore = trustScoreContract.getTrustScore(user);
        trustTier = trustNFT.getTierName(trustScore);
        tierLevel = trustNFT.getTierLevel(trustScore);
        reputationScore = reputationContract.getReputation(user);
        isActivated = feeContract.paidFee(user);
        kycLevel = kycContract.level(user);
        
        SybilResistantAirdrop airdrop = SybilResistantAirdrop(airdropAddress);
        eligibleForAirdrop = airdrop.isEligible(user);
        hasClaimedAirdrop = airdrop.hasClaimed(user);
        kycFilterLevel = filterContract.viewFilterLevel();
    }
    
    /**
     * @dev Set the mint cost
     * @param _mintCost New mint cost
     */
    function setMintCost(uint256 _mintCost) external onlyOwner {
        mintCost = _mintCost;
        emit MintCostUpdated(_mintCost);
    }
    
    /**
     * @dev Enable or disable minting
     */
    function toggleMinting() external onlyOwner {
        mintingEnabled = !mintingEnabled;
        if (mintingEnabled) {
            emit MintingEnabledByOwner();
        } else {
            emit MintingDisabledByOwner();
        }
    }
    
    /**
     * @dev Withdraw ETH from the contract
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner()).call{value: balance}("");
        if (!success) revert WithdrawalFailed();
    }
} 