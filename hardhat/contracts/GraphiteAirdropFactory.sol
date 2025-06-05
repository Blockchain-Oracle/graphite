// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SybilResistantAirdrop} from "./SybilResistantAirdrop.sol";
import {IGraphiteTrustScore} from "./interfaces/IGraphiteTrustScore.sol";
import {IGraphiteKYC} from "./interfaces/IGraphiteKYC.sol";
import {IGraphiteFee} from "./interfaces/IGraphiteFee.sol";

/**
 * @title GraphiteAirdropFactory
 * @dev Factory contract for creating and tracking Sybil-resistant airdrops
 */
contract GraphiteAirdropFactory is Ownable {
    // Graphite system contracts
    IGraphiteTrustScore public trustScoreContract;
    IGraphiteKYC public kycContract;
    IGraphiteFee public feeContract;
    
    // Graphite system contract addresses
    address public constant KYC_CONTRACT_ADDRESS = 0x0000000000000000000000000000000000001001;
    address public constant FEE_CONTRACT_ADDRESS = 0x0000000000000000000000000000000000001000; // This is for IGraphiteFee
    
    // Airdrop template requirements
    struct AirdropRequirements {
        uint256 trustScore;
        uint256 kycLevel;
    }
    
    // Mapping of template ID to requirements
    mapping(uint256 => AirdropRequirements) public templateRequirements;
    
    // All airdrops created by this factory
    SybilResistantAirdrop[] public airdrops;
    
    // Mapping from airdrop contract to creator
    mapping(address => address) public airdropCreators;
    
    // Mapping from creator to their airdrops
    mapping(address => SybilResistantAirdrop[]) public creatorAirdrops;
    
    // Events
    event AirdropCreated(address indexed creator, address indexed tokenAddress, address airdropContract);
    
    // Errors
    error InvalidTokenAddress();
    error InvalidMerkleRoot();
    error AccountNotActivated();
    error InsufficientKYCLevel();

    /**
     * @dev Constructor sets up the factory with Graphite system contract addresses
     * @param _trustScoreAdapter Address of the Graphite Trust Score contract
     * @param _feeContractAddress Address of the Graphite Fee contract (was _activationContract)
     */
    constructor(
        address _trustScoreAdapter,
        address _feeContractAddress // Renamed for clarity
    ) Ownable() {
        trustScoreContract = IGraphiteTrustScore(_trustScoreAdapter);
        kycContract = IGraphiteKYC(KYC_CONTRACT_ADDRESS);
        feeContract = IGraphiteFee(_feeContractAddress); // To this
        
        // Set default templates
        templateRequirements[1] = AirdropRequirements({
            trustScore: 300,
            kycLevel: 1
        });
        
        templateRequirements[2] = AirdropRequirements({
            trustScore: 500,
            kycLevel: 2
        });
        
        templateRequirements[3] = AirdropRequirements({
            trustScore: 700,
            kycLevel: 3
        });
        _transferOwnership(msg.sender);
    }
    
    /**
     * @dev Creates a new SybilResistantAirdrop contract
     * @param tokenAddress Address of the ERC20 token to be distributed
     * @param merkleRoot Merkle root for claim verification
     * @param requiredTrustScore Minimum trust score required
     * @param requiredKYCLevel Minimum KYC level required
     * @param startTime Start time for the airdrop
     * @param endTime End time for the airdrop
     * @return newAirdrop Address of the newly created airdrop
     */
    function createAirdrop(
        address tokenAddress,
        bytes32 merkleRoot,
        uint256 requiredTrustScore,
        uint256 requiredKYCLevel,
        uint256 startTime,
        uint256 endTime
    ) external returns (SybilResistantAirdrop newAirdrop) {
        if (tokenAddress == address(0)) revert InvalidTokenAddress();
        if (merkleRoot == bytes32(0)) revert InvalidMerkleRoot();
        
        // Check creator requirements
        if (!feeContract.paidFee(msg.sender)) revert AccountNotActivated();
        
        // Check KYC level using the real Graphite KYC contract
        if (kycContract.level(msg.sender) < 1) revert InsufficientKYCLevel();
        
        // Create new airdrop contract, passing all params to its constructor
        newAirdrop = new SybilResistantAirdrop(
            tokenAddress,
            merkleRoot,
            address(trustScoreContract),
            address(feeContract),
            requiredTrustScore,
            requiredKYCLevel,
            startTime,
            endTime
        );
        
        // Transfer ownership to the creator (msg.sender EOA)
        newAirdrop.transferOwnership(msg.sender);
        
        // Requirements and timing are now set in SybilResistantAirdrop constructor
        // So, no need to call updateRequirements or updateAirdropTiming here.
        
        // Track the new airdrop
        airdrops.push(newAirdrop);
        airdropCreators[address(newAirdrop)] = msg.sender;
        creatorAirdrops[msg.sender].push(newAirdrop);
        
        emit AirdropCreated(msg.sender, tokenAddress, address(newAirdrop));
        
        return newAirdrop;
    }
    
    /**
     * @dev Gets all airdrops created by this factory
     * @return All airdrop contract addresses
     */
    function getAllAirdrops() external view returns (SybilResistantAirdrop[] memory) {
        return airdrops;
    }
    
    /**
     * @dev Gets all airdrops created by a specific address
     * @param creator Address of the airdrop creator
     * @return Creator's airdrop contract addresses
     */
    function getCreatorAirdrops(address creator) external view returns (SybilResistantAirdrop[] memory) {
        return creatorAirdrops[creator];
    }
    
    /**
     * @dev Gets the total number of airdrops created
     * @return Total count of airdrops
     */
    function getAirdropCount() external view returns (uint256) {
        return airdrops.length;
    }
    
    /**
     * @dev Update the trust score contract address
     * @param _trustScoreContract New contract address
     */
    function setTrustScoreContract(address _trustScoreContract) external onlyOwner {
        trustScoreContract = IGraphiteTrustScore(_trustScoreContract);
    }
    
    /**
     * @dev Update the activation contract address
     * @param _activationContract New contract address
     */
    function setActivationContract(address _activationContract) external onlyOwner {
        feeContract = IGraphiteFee(_activationContract);
    }
    
    /**
     * @dev Get the KYC level for an address
     * @param user Address to check
     * @return level The KYC level
     */
    function getKYCLevel(address user) external view returns (uint256 level) {
        return kycContract.level(user);
    }
}
