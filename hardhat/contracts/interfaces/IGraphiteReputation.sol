// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title IGraphiteReputation
 * @dev Interface for interacting with Graphite's Reputation system
 */
interface IGraphiteReputation {
    /**
     * @dev Returns the reputation score for a given address (already scaled by 100)
     * @param addr Address to check the reputation for
     * @return score Reputation score (0-650, already multiplied by 100)
     * 
     * Reputation is calculated as: CD + A + KYC + QTx + Diff
     * Where:
     * - CD: Creation date score (0-100)
     * - A: Activation score (0-100)
     * - KYC: KYC level score (0-300)
     * - QTx: Transaction quantity score (0-100)
     * - Diff: Balance difference score (0-50)
     * 
     * The actual implementation returns this value already scaled by 100,
     * so no additional scaling is needed.
     */
    function getReputation(address addr) external view returns (uint256 score);
} 