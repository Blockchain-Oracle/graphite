// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./interfaces/IGraphiteTrustScore.sol";
import "./interfaces/IGraphiteReputation.sol";

/**
 * @title TestAdapter
 * @dev A test adapter that accurately converts reputation to trust score
 */
contract TestAdapter is IGraphiteTrustScore {
    // The address of the actual Graphite Reputation contract
    address public constant REPUTATION_CONTRACT_ADDRESS = 0x0000000000000000000000000000000000001008;
    
    // Instance of the reputation contract
    IGraphiteReputation private reputationContract;
    
    // Constants for scaling
    uint256 private constant MAX_REPUTATION = 650;  // Max reputation score from Graphite
    uint256 private constant MAX_TRUST_SCORE = 1000;  // Our max trust score
    
    /**
     * @dev Constructor initializes the adapter
     */
    constructor() {
        reputationContract = IGraphiteReputation(REPUTATION_CONTRACT_ADDRESS);
    }
    
    /**
     * @dev Get the trust score of an address by scaling the reputation score
     * @param user The address to check
     * @return trustScore The trust score (0-1000)
     */
    function getTrustScore(address user) external view override returns (uint256 trustScore) {
        uint256 reputationScore = reputationContract.getReputation(user);
        
        // Scale reputation score (0-650) to trust score (0-1000)
        // Using integer arithmetic: trustScore = (reputationScore * 1000) / 650
        trustScore = (reputationScore * MAX_TRUST_SCORE) / MAX_REPUTATION;
        
        // Cap at 1000 just in case reputation is somehow higher than expected
        if (trustScore > MAX_TRUST_SCORE) {
            trustScore = MAX_TRUST_SCORE;
        }
        
        return trustScore;
    }
    
    /**
     * @dev Get the tier level based on a trust score
     * @param trustScore The trust score
     * @return tier The tier level (1-5)
     */
    function getTierLevel(uint256 trustScore) external pure override returns (uint256 tier) {
        if (trustScore < 200) return 1; // Beginner
        if (trustScore < 400) return 2; // Novice
        if (trustScore < 600) return 3; // Trusted
        if (trustScore < 800) return 4; // Established
        return 5; // Elite
    }
    
    /**
     * @dev Check if an address meets a minimum trust score threshold
     * @param user The address to check
     * @param minScore The minimum required score
     * @return meets True if the user meets the minimum score
     */
    function meetsTrustThreshold(address user, uint256 minScore) external view override returns (bool meets) {
        return this.getTrustScore(user) >= minScore;
    }
} 