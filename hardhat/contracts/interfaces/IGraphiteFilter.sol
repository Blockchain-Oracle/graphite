// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title IGraphiteFilter
 * @dev Interface for interacting with Graphite's KYC Filter system
 */
interface IGraphiteFilter {
    /**
     * @dev Sets the KYC filter level for the caller's account
     * @param level The KYC filter level to set
     */
    function setFilterLevel(uint256 level) external;
    
    /**
     * @dev Returns the current KYC filter level for the caller's account
     * @return level The current KYC filter level
     */
    function viewFilterLevel() external view returns (uint256 level);
    
    /**
     * @dev Checks if a transaction from sender to destination would pass KYC filter
     * @param sender Address of the transaction sender
     * @param destination Address of the transaction recipient
     * @return allowed True if the transaction would be allowed, false otherwise
     */
    function filter(address sender, address destination) external view returns (bool allowed);
} 