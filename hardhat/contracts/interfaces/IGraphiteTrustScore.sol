// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title IGraphiteTrustScore
 * @dev Interface for interacting with Graphite's Trust Score system
 */
interface IGraphiteTrustScore {
    /**
     * @dev Get the trust score of an address
     * @param user The address to check
     * @return trustScore The trust score (0-1000)
     */
    function getTrustScore(address user) external view returns (uint256 trustScore);
    
    /**
     * @dev Get the tier level based on a trust score
     * @param trustScore The trust score
     * @return tier The tier level (1-5)
     */
    function getTierLevel(uint256 trustScore) external pure returns (uint256 tier);
    
    /**
     * @dev Check if an address meets a minimum trust score threshold
     * @param user The address to check
     * @param minScore The minimum required score
     * @return meets True if the user meets the minimum score
     */
    function meetsTrustThreshold(address user, uint256 minScore) external view returns (bool meets);
} 