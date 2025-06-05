// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./GraphiteVote.sol";
import "./interfaces/IGraphiteTrustScore.sol";
import "./interfaces/IGraphiteKYC.sol";
import "./interfaces/IGraphiteFee.sol";

/**
 * @title GraphiteVoteFactory
 * @dev Factory for creating GraphiteVote instances.
 *      Manages eligibility for vote creators.
 */
contract GraphiteVoteFactory is Ownable {
    address public immutable trustScoreContractAddress;
    
    // Using fixed Graphite system contract addresses
    IGraphiteKYC public constant kycContract = IGraphiteKYC(0x0000000000000000000000000000000000001001);
    IGraphiteFee public constant feeContract = IGraphiteFee(0x0000000000000000000000000000000000001000);

    address[] public voteContracts;
    uint256 public creatorMinimumKYCLevel; // Minimum KYC level required for a user to create a vote

    event VoteCreated(
        address indexed creator,
        address indexed voteContract,
        string description,
        uint256 requiredTrustScore,
        uint256 requiredKYCLevelForVoter
    );

    error CreatorNotActivated();
    error CreatorInsufficientKYC();
    error InvalidOptions();
    error InvalidTimeSettings();
    error InvalidTrustScoreContract();

    constructor(address _trustScoreContractAddress) {
        if(_trustScoreContractAddress == address(0)) revert InvalidTrustScoreContract();
        trustScoreContractAddress = _trustScoreContractAddress;
        creatorMinimumKYCLevel = 1; // Default: Level 1 KYC needed to create votes
        _transferOwnership(msg.sender); // Deployer is initial owner
    }

    function createVote(
        string calldata description,
        string[] calldata options,
        uint256 startTime, // Unix timestamp
        uint256 endTime,   // Unix timestamp, 0 for indefinite
        address requiredTokenAddress,
        uint256 requiredTokenBalance,
        uint256 requiredTrustScoreForVoter,
        uint256 requiredKYCLevelForVoter
    ) external returns (address voteContractAddress) {
        // Check creator eligibility
        if (!feeContract.paidFee(msg.sender)) {
            revert CreatorNotActivated();
        }
        if (kycContract.level(msg.sender) < creatorMinimumKYCLevel) {
            revert CreatorInsufficientKYC();
        }
        if (options.length == 0) {
            revert InvalidOptions();
        }
        if (startTime >= endTime && endTime != 0) {
            revert InvalidTimeSettings();
        }

        GraphiteVote newVoteContract = new GraphiteVote(
            description,
            options,
            startTime,
            endTime,
            trustScoreContractAddress,
            address(kycContract),
            address(feeContract),
            requiredTokenAddress,
            requiredTokenBalance,
            requiredTrustScoreForVoter,
            requiredKYCLevelForVoter,
            msg.sender // The proposal creator
        );

        newVoteContract.transferOwnership(msg.sender); // Creator owns their vote contract

        voteContractAddress = address(newVoteContract);
        voteContracts.push(voteContractAddress);

        emit VoteCreated(
            msg.sender,
            voteContractAddress,
            description,
            requiredTrustScoreForVoter,
            requiredKYCLevelForVoter
        );
        
        return voteContractAddress;
    }

    function setCreatorMinimumKYCLevel(uint256 _level) external onlyOwner {
        creatorMinimumKYCLevel = _level;
    }

    function getVoteContractsCount() external view returns (uint256) {
        return voteContracts.length;
    }

    function getVoteContractAtIndex(uint256 index) external view returns (address) {
        return voteContracts[index];
    }
} 