// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./interfaces/IGraphiteTrustScore.sol";

/**
 * @title GraphiteTrustNFT
 * @dev ERC721 token representing a user's trust level in the Graphite network
 *      Features dynamic metadata that evolves with the user's trust score
 */
contract GraphiteTrustNFT is ERC721Enumerable, Ownable {
    using Strings for uint256;

    // Interfaces
    IGraphiteTrustScore public trustScoreContract;

    // Metadata URI
    string private _customBaseURI;
    
    // Metadata server endpoint that will handle the badge generation
    string public metadataServer;
    
    // Track the last minted token ID
    uint256 private _lastTokenId;

    // Map token ID to trust score when it was last checked
    mapping(uint256 => uint256) public lastTrustScore;

    // Map token ID to customizable properties
    mapping(uint256 => BadgeData) private _badgeData;
    
    // Map token ID to badge customization timestamp
    mapping(uint256 => uint256) public lastCustomized;
    
    // Define trust tiers
    uint256 private constant MAX_TRUST_SCORE = 1000;
    
    // Badge data structure for customization
    struct BadgeData {
        uint8 badgeType;      // Badge template (1-10)
        string badgeName;     // Custom name for the badge
        string badgeMessage;  // Custom message for the badge
        bool verified;        // Special badge for verified users
    }

    // Events
    event TrustScoreRefreshed(uint256 indexed tokenId, uint256 newScore);
    event BadgeCustomized(uint256 indexed tokenId, uint8 badgeType, string badgeName);
    event MetadataRefreshed(uint256 indexed tokenId);

    // Errors
    error InsufficientTrustForCustomization();
    error NotTokenOwner();
    error InvalidBadgeType();
    error TokenDoesNotExist();

    /**
     * @dev Constructor for the GraphiteTrustNFT contract
     * @param name The name of the NFT
     * @param symbol The symbol of the NFT
     * @param _trustScoreAdapter The address of the trust score contract
     * @param baseURI_ Base URI for token metadata
     * @param _metadataServer API endpoint for badge metadata generation
     */
    constructor(
        string memory name,
        string memory symbol,
        address _trustScoreAdapter,
        string memory baseURI_,
        string memory _metadataServer
    ) ERC721(name, symbol) Ownable() {
        trustScoreContract = IGraphiteTrustScore(_trustScoreAdapter);
        _customBaseURI = baseURI_;
        metadataServer = _metadataServer;
        _transferOwnership(msg.sender);
    }

    /**
     * @dev Mint a new trust badge
     * @param recipient The address that will receive the minted token
     * @return tokenId The ID of the minted token
     */
    function mint(address recipient) public payable virtual returns (uint256) {
        uint256 tokenId = ++_lastTokenId;
        
        // Initialize the badge data with default values
        _badgeData[tokenId] = BadgeData({
            badgeType: 1,
            badgeName: "",
            badgeMessage: "",
            verified: false
        });

        // Store current trust score for the recipient
        lastTrustScore[tokenId] = trustScoreContract.getTrustScore(recipient);
        
        _mint(recipient, tokenId);
        
        return tokenId;
    }
    
    /**
     * @dev Mint with a specific badge model 
     * @param recipient The address that will receive the minted token
     * @param badgeType The badge type to start with (1-10)
     * @return tokenId The ID of the minted token
     */
    function mintWithModel(address recipient, uint8 badgeType) public payable returns (uint256) {
        if (badgeType < 1 || badgeType > 10) revert InvalidBadgeType();
        
        uint256 tokenId = ++_lastTokenId;
        
        // Initialize the badge data with selected type
        _badgeData[tokenId] = BadgeData({
            badgeType: badgeType,
            badgeName: "",
            badgeMessage: "",
            verified: false
        });
        
        // Store current trust score for the recipient
        lastTrustScore[tokenId] = trustScoreContract.getTrustScore(recipient);
        
        _mint(recipient, tokenId);
        
        return tokenId;
    }
    
    /**
     * @dev Set the name for a badge
     * @param tokenId The token ID to customize
     * @param name The new name for the badge
     */
    function setBadgeName(uint256 tokenId, string calldata name) external {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        
        _badgeData[tokenId].badgeName = name;
        lastCustomized[tokenId] = block.timestamp;
        
        emit BadgeCustomized(tokenId, _badgeData[tokenId].badgeType, name);
        emit MetadataRefreshed(tokenId);
    }
    
    /**
     * @dev Set the badge message
     * @param tokenId The token ID to customize
     * @param message The new message for the badge
     */
    function setBadgeMessage(uint256 tokenId, string calldata message) external {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        
        _badgeData[tokenId].badgeMessage = message;
        lastCustomized[tokenId] = block.timestamp;
        
        emit MetadataRefreshed(tokenId);
    }

    /**
     * @dev Set the badge type
     * @param tokenId The token ID to customize
     * @param badgeType The new badge type (1-10)
     */
    function setBadgeType(uint256 tokenId, uint8 badgeType) external {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        if (badgeType < 1 || badgeType > 10) revert InvalidBadgeType();
        
        // Check if user has sufficient trust score for this badge type
        uint256 ownerScore = trustScoreContract.getTrustScore(msg.sender);
        uint256 requiredScore = getBadgeTypeRequirement(badgeType);
        
        if (ownerScore < requiredScore) revert InsufficientTrustForCustomization();
        
        _badgeData[tokenId].badgeType = badgeType;
        lastCustomized[tokenId] = block.timestamp;
        
        emit BadgeCustomized(tokenId, badgeType, _badgeData[tokenId].badgeName);
        emit MetadataRefreshed(tokenId);
    }
    
    /**
     * @dev Set the verified status for a badge (onlyOwner)
     * @param tokenId The token ID to verify
     * @param verified The verified status
     */
    function setVerifiedStatus(uint256 tokenId, bool verified) external onlyOwner {
        _badgeData[tokenId].verified = verified;
        emit MetadataRefreshed(tokenId);
    }

    /**
     * @dev Get badge data for a token
     * @param tokenId The token ID
     * @return badgeType The badge template type (1-10)
     * @return badgeName The custom name for the badge
     * @return badgeMessage The custom message for the badge
     * @return verified Whether the badge is verified
     */
    function getBadgeData(uint256 tokenId) external view returns (
        uint8 badgeType,
        string memory badgeName,
        string memory badgeMessage,
        bool verified
    ) {
        return (
            _badgeData[tokenId].badgeType,
            _badgeData[tokenId].badgeName,
            _badgeData[tokenId].badgeMessage,
            _badgeData[tokenId].verified
        );
    }
    
    /**
     * @dev Update the trust score for a token, typically for a specific user.
     * @param tokenId The token ID to update.
     * @param userToRefresh The address of the user whose trust score should be fetched and updated for the token.
     */
    function refreshTrustScore(uint256 tokenId, address userToRefresh) external {
        // Caller must be the owner of this contract (Ecosystem) or the user refreshing their own token.
        require(msg.sender == owner() || msg.sender == userToRefresh, "Caller not authorized");

        if (!_exists(tokenId)) revert TokenDoesNotExist();
        // The userToRefresh must be the actual owner of the token.
        if (ownerOf(tokenId) != userToRefresh) revert NotTokenOwner(); 
        
        lastTrustScore[tokenId] = trustScoreContract.getTrustScore(userToRefresh);
        
        emit TrustScoreRefreshed(tokenId, lastTrustScore[tokenId]);
        emit MetadataRefreshed(tokenId);
    }
    
    /**
     * @dev Get the tier level based on trust score
     * @param trustScore The trust score to check
     * @return tier The tier level (1-5)
     */
    function getTierLevel(uint256 trustScore) public pure returns (uint256) {
        if (trustScore < 200) return 1; // Beginner
        if (trustScore < 400) return 2; // Novice
        if (trustScore < 600) return 3; // Trusted
        if (trustScore < 800) return 4; // Established
        return 5; // Elite
    }
    
    /**
     * @dev Get the tier name based on trust score
     * @param trustScore The trust score to check
     * @return tierName The tier name
     */
    function getTierName(uint256 trustScore) public pure returns (string memory) {
        uint256 tier = getTierLevel(trustScore);
        
        if (tier == 1) return "Beginner";
        if (tier == 2) return "Novice";
        if (tier == 3) return "Trusted";
        if (tier == 4) return "Established";
        return "Elite";
    }
    
    /**
     * @dev Get the required trust score for a badge type
     * @param badgeType The badge type
     * @return requiredScore The required trust score
     */
    function getBadgeTypeRequirement(uint8 badgeType) public pure returns (uint256) {
        if (badgeType <= 2) return 0;      // Basic badges for everyone
        if (badgeType <= 4) return 200;    // Novice tier badges
        if (badgeType <= 6) return 400;    // Trusted tier badges
        if (badgeType <= 8) return 600;    // Established tier badges
        return 800;                        // Elite tier badges
    }
    
    /**
     * @dev Generates token metadata URI using off-chain service
     * @param tokenId The token ID
     * @return uri Token URI pointing to off-chain metadata
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (!_exists(tokenId)) revert TokenDoesNotExist();
        
        BadgeData memory badge = _badgeData[tokenId];
        
        // Build metadata URL in parts to avoid stack too deep error
        return _buildTokenURI(
            tokenId,
            lastTrustScore[tokenId],
            badge.badgeType,
            badge.badgeName,
            badge.badgeMessage,
            ownerOf(tokenId),
            badge.verified
        );
    }
    
    /**
     * @dev Helper function to build the token URI to avoid stack too deep errors
     */
    function _buildTokenURI(
        uint256 tokenId,
        uint256 trustScore,
        uint8 badgeType,
        string memory badgeName,
        string memory badgeMessage,
        address owner,
        bool verified
    ) private view returns (string memory) {
        // First part: base URL with token ID
        string memory baseUrl = string(abi.encodePacked(
            metadataServer,
            "/",
            tokenId.toString()
        ));
        
        // Parameters part
        string memory params = _buildURIParams(
            trustScore,
            badgeType,
            badgeName,
            badgeMessage,
            owner,
            verified
        );
        
        // Combine parts
        return string(abi.encodePacked(baseUrl, params));
    }
    
    /**
     * @dev Helper function to build URI parameters to avoid stack too deep errors
     */
    function _buildURIParams(
        uint256 trustScore,
        uint8 badgeType,
        string memory badgeName,
        string memory badgeMessage,
        address owner,
        bool verified
    ) private view returns (string memory) {
        return string(abi.encodePacked(
            "?trustScore=",
            trustScore.toString(),
            "&badgeType=",
            uint256(badgeType).toString(),
            "&badgeName=",
            badgeName,
            "&badgeMessage=",
            badgeMessage,
            "&owner=",
            Strings.toHexString(uint256(uint160(owner)), 20),
            "&verified=",
            verified ? "true" : "false",
            "&timestamp=",
            block.timestamp.toString()
        ));
    }
    
    /**
     * @dev Helper function that checks if a token exists
     * @param tokenId The token ID to check
     * @return Whether the token exists
     */
    function _exists(uint256 tokenId) internal view override returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    
    /**
     * @dev Get the last minted token ID
     * @return The last token ID
     */
    function lastMinted() external view returns (uint256) {
        return _lastTokenId;
    }

    /**
     * @dev Set the base URI
     * @param baseURI_ New base URI
     */
    function setBaseURI(string calldata baseURI_) external onlyOwner {
        _customBaseURI = baseURI_;
    }

    /**
     * @dev Set the metadata server URL
     * @param _metadataServer New metadata server URL
     */
    function setMetadataServer(string calldata _metadataServer) external onlyOwner {
        metadataServer = _metadataServer;
    }

    /**
     * @dev Set the trust score contract
     * @param _trustScoreContract New trust score contract
     */
    function setTrustScoreContract(address _trustScoreContract) external onlyOwner {
        trustScoreContract = IGraphiteTrustScore(_trustScoreContract);
    }
    
    /**
     * @dev Returns the base URI set via {_setBaseURI}
     */
    function _baseURI() internal view override returns (string memory) {
        return _customBaseURI;
    }
} 