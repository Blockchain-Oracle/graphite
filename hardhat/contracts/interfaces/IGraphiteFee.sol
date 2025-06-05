// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title IGraphiteFee
 * @dev Interface for interacting with Graphite's Account Activation system (FeeContract)
 */
interface IGraphiteFee {
    /**
     * @dev Pays the fee for account activation.
     * @notice This function activates the caller's account, allowing it to send transactions.
     * @notice Excess fee will be returned to the caller.
     */
    function pay() external payable;
    
    /**
     * @dev Changes the activation fee amount (admin only).
     * @param newFee New activation fee amount.
     */
    function changeFee(uint256 newFee) external;

    /**
     * @dev Checks if an address has paid the activation fee.
     * @param addr Address to check.
     * @return True if the fee has been paid, false otherwise.
     */
    function paidFee(address addr) external view returns (bool);

    /**
     * @dev Returns the block number when an address paid the activation fee.
     * @param addr Address to check.
     * @return Block number of activation, or 0 if not activated.
     */
    function paidFeeBlock(address addr) external view returns (uint256);

    /**
     * @dev Returns the current activation fee.
     * @return The current activation fee amount.
     */
    function initialFee() external view returns (uint256);
} 