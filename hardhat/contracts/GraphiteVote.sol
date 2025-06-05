// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IGraphiteTrustScore.sol";
import "./interfaces/IGraphiteKYC.sol";
import "./interfaces/IGraphiteFee.sol";

/**
 * @title GraphiteVote
 * @dev A contract for managing a single voting proposal with specific eligibility rules.
 *      Ownership is transferred to the creator upon deployment by the factory.
 */
contract GraphiteVote is Ownable {
    string public description;
    string[] private options; // Changed from public to private
    uint256 public immutable startTime;
    uint256 public immutable endTime;

    IGraphiteTrustScore public immutable trustScoreContract;
    IGraphiteKYC public immutable kycContract;
    IGraphiteFee public immutable feeContract;

    IERC20 public immutable requiredToken; // address(0) if no token required
    uint256 public immutable requiredTokenBalance;
    uint256 public immutable requiredTrustScore;
    uint256 public immutable requiredKYCLevel; // Minimum KYC level (e.g., 0, 1, 2, 3)

    mapping(uint256 => uint256) public votesPerOption; // optionIndex => voteCount
    mapping(address => bool) public hasVoted;
    uint256 public totalVotesCasted;

    address public immutable proposalCreator;

    event Voted(address indexed voter, uint256 optionIndex);

    error VoteNotActive();
    error VoteEnded();
    error AlreadyVoted();
    error InvalidOption();

    // Enum for detailed eligibility status, also used by NotEligibleToVote error
    enum EligibilityStatus {
        Eligible, // 0
        NotActivated, // 1
        InsufficientKYC, // 2
        LowTrustScore, // 3
        InsufficientTokenBalance, // 4
        GenericIneligible // 5 (fallback, though canVote handles most of these)
    }

    // Struct for returning eligibility details
    struct EligibilityDetails {
        bool isActiveOnGraphite;
        uint256 userKycLevel;
        uint256 userTrustScore;
        uint256 userTokenBalance;
        bool meetsAllRequirements;
        EligibilityStatus statusReason;
    }

    error NotEligibleToVote(EligibilityStatus reason); // New error using enum

    constructor(
        string memory _description,
        string[] memory _options,
        uint256 _startTime,
        uint256 _endTime,
        address _trustScoreContractAddress,
        address _kycContractAddress,
        address _feeContractAddress,
        address _requiredTokenAddress,
        uint256 _requiredTokenBalance,
        uint256 _requiredTrustScore,
        uint256 _requiredKYCLevel,
        address _proposalCreator // Set by the factory
    ) {
        if (_startTime >= _endTime && _endTime != 0) revert("End time must be after start time");
        if (_options.length == 0) revert("At least one option required");

        description = _description;
        options = _options; // Initialized here
        startTime = _startTime;
        endTime = _endTime;
        trustScoreContract = IGraphiteTrustScore(_trustScoreContractAddress);
        kycContract = IGraphiteKYC(_kycContractAddress);
        feeContract = IGraphiteFee(_feeContractAddress);
        requiredToken = IERC20(_requiredTokenAddress);
        requiredTokenBalance = _requiredTokenBalance;
        requiredTrustScore = _requiredTrustScore;
        requiredKYCLevel = _requiredKYCLevel;
        proposalCreator = _proposalCreator;
        // Ownership is typically transferred to _proposalCreator by the factory after deployment
    }

    function vote(uint256 optionIndex) external {
        if (block.timestamp < startTime) revert VoteNotActive();
        if (endTime != 0 && block.timestamp > endTime) revert VoteEnded();
        if (hasVoted[msg.sender]) revert AlreadyVoted();
        if (optionIndex >= options.length) revert InvalidOption();

        _checkEligibility(msg.sender);

        votesPerOption[optionIndex]++;
        hasVoted[msg.sender] = true;
        totalVotesCasted++;

        emit Voted(msg.sender, optionIndex);
    }

    function _checkEligibility(address user) internal view {
        // 1. Graphite Account Activation Check
        if (!feeContract.paidFee(user)) {
            revert NotEligibleToVote(EligibilityStatus.NotActivated);
        }

        // 2. KYC Level Check
        if (kycContract.level(user) < requiredKYCLevel) {
            revert NotEligibleToVote(EligibilityStatus.InsufficientKYC);
        }

        // 3. Trust Score Check
        if (trustScoreContract.getTrustScore(user) < requiredTrustScore) {
            revert NotEligibleToVote(EligibilityStatus.LowTrustScore);
        }

        // 4. Token Balance Check (if a token is required)
        if (address(requiredToken) != address(0)) {
            if (requiredToken.balanceOf(user) < requiredTokenBalance) {
                revert NotEligibleToVote(EligibilityStatus.InsufficientTokenBalance);
            }
        }
    }

    function canVote(address user) external view returns (bool) {
        if (block.timestamp < startTime || (endTime != 0 && block.timestamp > endTime) || hasVoted[user]) {
            return false;
        }
        
        // Perform eligibility checks directly
        if (!feeContract.paidFee(user)) {
            return false;
        }
        if (kycContract.level(user) < requiredKYCLevel) {
            return false;
        }
        if (trustScoreContract.getTrustScore(user) < requiredTrustScore) {
            return false;
        }
        if (address(requiredToken) != address(0)) {
            if (requiredToken.balanceOf(user) < requiredTokenBalance) {
                return false;
            }
        }
        return true;
    }
    
    // Refactored to return a struct instead of multiple values
    function getEligibilityDetails(address user) external view returns (EligibilityDetails memory details) {
        details.isActiveOnGraphite = feeContract.paidFee(user);
        details.userKycLevel = kycContract.level(user);
        details.userTrustScore = trustScoreContract.getTrustScore(user);
        
        if (address(requiredToken) != address(0)) {
            details.userTokenBalance = requiredToken.balanceOf(user);
        } else {
            details.userTokenBalance = 0;
        }

        // Set default for meetsAllRequirements - will be updated if any check fails
        details.meetsAllRequirements = true;

        if (!details.isActiveOnGraphite) {
            details.statusReason = EligibilityStatus.NotActivated;
            details.meetsAllRequirements = false;
            return details;
        }
        if (details.userKycLevel < requiredKYCLevel) {
            details.statusReason = EligibilityStatus.InsufficientKYC;
            details.meetsAllRequirements = false;
            return details;
        }
        if (details.userTrustScore < requiredTrustScore) {
            details.statusReason = EligibilityStatus.LowTrustScore;
            details.meetsAllRequirements = false;
            return details;
        }
        if (address(requiredToken) != address(0) && details.userTokenBalance < requiredTokenBalance) {
            details.statusReason = EligibilityStatus.InsufficientTokenBalance;
            details.meetsAllRequirements = false;
            return details;
        }
        
        details.statusReason = EligibilityStatus.Eligible;
        return details;
    }

    function getVoteCount(uint256 optionIndex) external view returns (uint256) {
        if (optionIndex >= options.length) revert InvalidOption();
        return votesPerOption[optionIndex];
    }

    // --- Custom Getters for options array ---
    function getOptionsCount() external view returns (uint256) {
        return options.length;
    }

    function getOption(uint256 index) external view returns (string memory) {
        if (index >= options.length) revert InvalidOption();
        return options[index];
    }
} 