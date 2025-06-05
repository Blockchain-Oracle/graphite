// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {IGraphiteTrustScore} from "./interfaces/IGraphiteTrustScore.sol";
import {IGraphiteKYC} from "./interfaces/IGraphiteKYC.sol";
import {IGraphiteFee} from "./interfaces/IGraphiteFee.sol";
import {IGraphiteFilter} from "./interfaces/IGraphiteFilter.sol";
import {IGraphiteReputation} from "./interfaces/IGraphiteReputation.sol";

/**
 * @title SybilResistantAirdrop
 * @dev Contract that implements a Sybil-resistant airdrop system using Graphite's trust and KYC systems
 */
contract SybilResistantAirdrop is Ownable {
    // Default requirement constants
    /// @dev Default trust score requirement (range 0-1000) representing a mid-level trust score
    uint256 public constant DEFAULT_TRUST_SCORE = 200;
    
    /// @dev Default KYC level requirement (1 = basic KYC)
    uint256 public constant DEFAULT_KYC_LEVEL = 1;
    
    /// @dev Default airdrop duration in seconds (30 days)
    uint256 public constant DEFAULT_AIRDROP_DURATION = 30 days;
    
    // Custom errors
    error AirdropNotStarted();
    error AirdropEnded();
    error AlreadyClaimed();
    error AddressBlacklisted();
    error NotEligible();
    error InvalidMerkleProof();
    error TransferFailed();
    error ArrayLengthMismatch();
    error EndTimeBeforeStartTime();
    error NoTokensToWithdraw();
    error AirdropStillInProgress();
    
    // Graphite system contract addresses
    address public constant KYC_CONTRACT_ADDRESS = 0x0000000000000000000000000000000000001001;
    
    // Graphite interfaces
    IGraphiteTrustScore public trustScoreContract;
    IGraphiteFee public feeContract;
    IGraphiteKYC public kycContract;
    
    // Airdrop token
    IERC20 public token;
    
    // Merkle root for verification
    bytes32 public merkleRoot;
    
    // Airdrop requirements
    uint256 public requiredTrustScore;
    uint256 public requiredKYCLevel;
    
    // Maps addresses to whether they've claimed their airdrop
    mapping(address => bool) public hasClaimed;
    
    // Blacklist for known Sybil attackers
    mapping(address => bool) public blacklisted;
    
    // Airdrop timing
    uint256 public startTime;
    uint256 public endTime;
    
    // Events
    event AirdropClaimed(address indexed user, uint256 amount);
    event BlacklistUpdated(address indexed user, bool isBlacklisted);
    event RequirementsUpdated(uint256 trustScore, uint256 kycLevel);
    event AirdropTimingUpdated(uint256 startTime, uint256 endTime);
    
    /**
     * @dev Constructor sets up the airdrop contract
     * @param _token Address of the token to airdrop
     * @param _merkleRoot Merkle root for claim verification
     * @param _trustScoreContract Address of the Graphite Trust Score contract
     * @param _feeContractAddress Address of the Graphite Fee contract (was _activationContract)
     * @param _requiredTrustScore Minimum trust score required
     * @param _requiredKYCLevel Minimum KYC level required
     * @param _startTime Start time for the airdrop
     * @param _endTime End time for the airdrop
     */
    constructor(
        address _token,
        bytes32 _merkleRoot,
        address _trustScoreContract,
        address _feeContractAddress,
        uint256 _requiredTrustScore,
        uint256 _requiredKYCLevel,
        uint256 _startTime,
        uint256 _endTime
    ) Ownable() {
        token = IERC20(_token);
        merkleRoot = _merkleRoot;
        trustScoreContract = IGraphiteTrustScore(_trustScoreContract);
        feeContract = IGraphiteFee(_feeContractAddress);
        kycContract = IGraphiteKYC(KYC_CONTRACT_ADDRESS);
        
        // Set requirements from constructor arguments
        requiredTrustScore = _requiredTrustScore;
        requiredKYCLevel = _requiredKYCLevel;
        
        // Set timing from constructor arguments
        // Allow 0 for startTime/endTime to use defaults, otherwise validate endTime
        if (_endTime != 0 && _startTime != 0 && _endTime <= _startTime) {
            revert EndTimeBeforeStartTime();
        }
        
        startTime = (_startTime == 0) ? block.timestamp : _startTime;
        endTime = (_endTime == 0) ? block.timestamp + DEFAULT_AIRDROP_DURATION : _endTime;
        // Note: Ownership is transferred by the factory after deployment.
        // _transferOwnership(msg.sender); // This line is removed
    }
    
    /**
     * @dev Claims tokens if the user is eligible
     * @param amount Amount of tokens to claim
     * @param proof Merkle proof verifying the claim
     */
    function claim(uint256 amount, bytes32[] calldata proof) external {
        if (block.timestamp < startTime) revert AirdropNotStarted();
        if (block.timestamp > endTime) revert AirdropEnded();
        if (hasClaimed[msg.sender]) revert AlreadyClaimed();
        if (blacklisted[msg.sender]) revert AddressBlacklisted();
        if (!isEligible(msg.sender)) revert NotEligible();
        
        // Verify the merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        if (!MerkleProof.verify(proof, merkleRoot, leaf)) revert InvalidMerkleProof();
        
        // Mark as claimed and transfer tokens
        hasClaimed[msg.sender] = true;
        bool success = token.transfer(msg.sender, amount);
        if (!success) revert TransferFailed();
        
        emit AirdropClaimed(msg.sender, amount);
    }
    
    /**
     * @dev Checks if an address is eligible for the airdrop based on trust score and KYC
     * @param user Address to check eligibility
     * @return eligible Whether the address is eligible
     */
    function isEligible(address user) public view returns (bool eligible) {
        // Check account is activated
        if (!feeContract.paidFee(user)) {
            return false;
        }
        
        // Check KYC level using correct interface
        if (kycContract.level(user) < requiredKYCLevel) {
            return false;
        }
        
        // Check Trust Score
        if (trustScoreContract.getTrustScore(user) < requiredTrustScore) {
            return false;
        }
        
        return true;
    }
    
    /**
     * @dev Gets detailed eligibility information for a user
     * @param user Address to check
     * @return isActivated Account activation status
     * @return trustScore User's trust score
     * @return kycLevel User's KYC level
     * @return isBlacklisted Whether the user is blacklisted
     * @return hasClaimedAirdrop Whether the user has already claimed
     */
    function getEligibilityDetails(address user) external view returns (
        bool isActivated,
        uint256 trustScore,
        uint256 kycLevel,
        bool isBlacklisted,
        bool hasClaimedAirdrop
    ) {
        isActivated = feeContract.paidFee(user);
        trustScore = trustScoreContract.getTrustScore(user);
        kycLevel = kycContract.level(user);
        isBlacklisted = blacklisted[user];
        hasClaimedAirdrop = hasClaimed[user];
    }
    
    /**
     * @dev Updates the blacklist status for an address
     * @param user Address to update
     * @param isBlacklisted Blacklist status to set
     */
    function setBlacklist(address user, bool isBlacklisted) external onlyOwner {
        blacklisted[user] = isBlacklisted;
        emit BlacklistUpdated(user, isBlacklisted);
    }
    
    /**
     * @dev Batch update blacklist statuses
     * @param users Array of addresses to update
     * @param statuses Array of blacklist statuses
     */
    function batchSetBlacklist(address[] calldata users, bool[] calldata statuses) external onlyOwner {
        if (users.length != statuses.length) revert ArrayLengthMismatch();
        
        for (uint256 i = 0; i < users.length; i++) {
            blacklisted[users[i]] = statuses[i];
            emit BlacklistUpdated(users[i], statuses[i]);
        }
    }
    
    /**
     * @dev Updates airdrop eligibility requirements
     * @param _trustScore New required Trust Score
     * @param _kycLevel New required KYC level
     */
    function updateRequirements(
        uint256 _trustScore,
        uint256 _kycLevel
    ) external onlyOwner {
        requiredTrustScore = _trustScore;
        requiredKYCLevel = _kycLevel;
        
        emit RequirementsUpdated(_trustScore, _kycLevel);
    }
    
    /**
     * @dev Updates the merkle root for verification
     * @param _merkleRoot New merkle root
     */
    function updateMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }
    
    /**
     * @dev Updates airdrop timing
     * @param _startTime New start time
     * @param _endTime New end time
     */
    function updateAirdropTiming(uint256 _startTime, uint256 _endTime) external onlyOwner {
        if (_endTime <= _startTime) revert EndTimeBeforeStartTime();
        
        startTime = _startTime;
        endTime = _endTime;
        
        emit AirdropTimingUpdated(_startTime, _endTime);
    }
    
    /**
     * @dev Withdraws any tokens accidentally sent to the contract
     * @param _token Address of the token to withdraw
     */
    function withdrawTokens(address _token) external onlyOwner {
        IERC20 tokenToWithdraw = IERC20(_token);
        uint256 balance = tokenToWithdraw.balanceOf(address(this));
        if (balance == 0) revert NoTokensToWithdraw();
        
        if (_token == address(token)) {
            // If withdrawing the airdrop token, make sure the airdrop has ended
            if (block.timestamp <= endTime) revert AirdropStillInProgress();
        }
        
        tokenToWithdraw.transfer(owner(), balance);
    }
}
