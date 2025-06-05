// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title IGraphiteKYC
 * @dev Interface for interacting with Graphite's KYC (Know Your Customer) system
 */
interface IGraphiteKYC {
    /**
     * @dev Returns the KYC level of a given address
     * @param user Address to check KYC level for
     * @return kycLevel The KYC level (0-3, where 0 is no KYC)
     */
    function level(address user) external view returns (uint256 kycLevel);

    /**
     * @dev Creates a KYC request for the caller.
     * This function is expected to be payable if fees are involved.
     * @param _level The desired KYC level to apply for.
     * @param _data Associated data for the KYC request (e.g., hash of documents).
     */
    function createKYCRequest(uint _level, bytes32 _data) external payable;

    // It seems the functions below were assumptions and do not exist on the actual Graphite KYC contract
    // function getKYCRequestStatus(address user) external view returns (uint8 status);
    // function getKYCApplicationFee(uint256 level) external view returns (uint256 fee);
    // function getLastKYCUpdateTimestamp(address user) external view returns (uint256 timestamp);
} 