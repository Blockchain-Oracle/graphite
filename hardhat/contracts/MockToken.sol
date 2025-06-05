// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockToken
 * @dev A simple ERC20 token for testing airdrops
 */
contract MockToken is ERC20, Ownable {
    /**
     * @dev Constructor that mints tokens to the deployer
     * @param name The name of the token
     * @param symbol The symbol of the token
     * @param initialSupply The initial supply (in wei)
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable() {
        _mint(msg.sender, initialSupply);
    }
    
    /**
     * @dev Allows the owner to mint additional tokens
     * @param to Address to receive the tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
} 