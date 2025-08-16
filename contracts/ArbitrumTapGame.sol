// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Arbitrum Tap Tap Game NFT Contract
 * @dev NFT contract for the Arbitrum Tap Tap Game with milestone-based minting
 * @author Arbitrum Community
 */
contract ArbitrumTapGame is ERC721, Ownable, ReentrancyGuard {
    // Milestone thresholds and rewards
    uint256[] public milestones = [100, 500, 1000, 5000, 10000, 50000, 100000, 200000, 300000];
    uint256[] public rewards = [0.001 ether, 0.005 ether, 0.01 ether, 0.05 ether, 0.1 ether, 0.5 ether, 1 ether, 2 ether, 3 ether];
    
    // Player data structure
    struct Player {
        uint256 totalTaps;
        uint256 currentLevel;
        uint256 nftsMinted;
        mapping(uint256 => bool) milestonesAchieved;
        uint256 lastMintTimestamp;
        uint256 lastLevelUpTimestamp;
    }
    
    // Game state
    uint256 private _tokenIds;
    mapping(address => Player) public players;
    mapping(uint256 => uint256) public leaderboard; // score => player count
    address[] public topPlayers;
    
    // Events
    event NFTMinted(address indexed player, uint256 tokenId, uint256 milestone, uint256 reward);
    event MilestoneAchieved(address indexed player, uint256 milestone, uint256 reward);
    event PlayerScoreUpdated(address indexed player, uint256 newScore);
    event PlayerLevelUpdated(address indexed player, uint256 newLevel, uint256 requiredTaps);
    
    // Modifiers
    modifier validMilestone(uint256 milestone) {
        bool isValid = false;
        for (uint256 i = 0; i < milestones.length; i++) {
            if (milestones[i] == milestone) {
                isValid = true;
                break;
            }
        }
        require(isValid, "Invalid milestone");
        _;
    }
    
    modifier milestoneNotAchieved(address player, uint256 milestone) {
        require(!players[player].milestonesAchieved[milestone], "Milestone already achieved");
        _;
    }
    
    modifier sufficientTaps(address player, uint256 milestone) {
        require(players[player].totalTaps >= milestone, "Insufficient taps for milestone");
        _;
    }
    
    constructor() ERC721("Arbitrum Tap Tap Game", "ARBTAP") Ownable(msg.sender) {}
    
    /**
     * @dev Update player's tap count and check for milestones
     * @param newTapCount New total tap count for the player
     */
    function updateTaps(uint256 newTapCount) external {
        require(newTapCount > players[msg.sender].totalTaps, "New count must be higher");
        
        players[msg.sender].totalTaps = newTapCount;
        emit PlayerScoreUpdated(msg.sender, newTapCount);
        
        // Update leaderboard
        updateLeaderboard(msg.sender, newTapCount);
        
        // Check for new milestones
        checkMilestones(msg.sender);
    }
    
    /**
     * @dev Update player's level (requires sufficient taps)
     * @param newLevel New level for the player
     */
    function updateLevel(uint256 newLevel) external {
        require(newLevel > players[msg.sender].currentLevel, "New level must be higher");
        require(newLevel <= 50, "Maximum level is 50"); // Set reasonable max level
        
        // Calculate required taps for this level (exponential growth)
        uint256 requiredTaps = newLevel * newLevel * 100;
        require(players[msg.sender].totalTaps >= requiredTaps, "Insufficient taps for this level");
        
        // Update player level
        players[msg.sender].currentLevel = newLevel;
        players[msg.sender].lastLevelUpTimestamp = block.timestamp;
        
        emit PlayerLevelUpdated(msg.sender, newLevel, requiredTaps);
        
        // Check for new milestones after level up
        checkMilestones(msg.sender);
    }

    /**
     * @dev Check if player has achieved new milestones
     * @param player Address of the player to check
     */
    function checkMilestones(address player) internal {
        for (uint256 i = 0; i < milestones.length; i++) {
            uint256 milestone = milestones[i];
            if (players[player].totalTaps >= milestone && 
                !players[player].milestonesAchieved[milestone]) {
                
                players[player].milestonesAchieved[milestone] = true;
                emit MilestoneAchieved(player, milestone, rewards[i]);
            }
        }
    }
    
    /**
     * @dev Mint NFT for achieving a milestone
     * @param milestone The milestone threshold that was reached
     */
    function mintNFT(uint256 milestone) 
        external 
        nonReentrant 
        validMilestone(milestone)
        milestoneNotAchieved(msg.sender, milestone)
        sufficientTaps(msg.sender, milestone) {
        
        // Mark milestone as achieved
        players[msg.sender].milestonesAchieved[milestone] = true;
        players[msg.sender].nftsMinted++;
        players[msg.sender].lastMintTimestamp = block.timestamp;
        
        // Mint the NFT
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        _safeMint(msg.sender, newTokenId);
        
        // Find reward amount for this milestone
        uint256 reward = 0;
        for (uint256 i = 0; i < milestones.length; i++) {
            if (milestones[i] == milestone) {
                reward = rewards[i];
                break;
            }
        }
        
        // Send reward if contract has sufficient balance
        if (address(this).balance >= reward) {
            (bool success, ) = payable(msg.sender).call{value: reward}("");
            require(success, "Reward transfer failed");
        }
        
        emit NFTMinted(msg.sender, newTokenId, milestone, reward);
    }
    
    /**
     * @dev Update leaderboard with new player score
     * @param player Address of the player
     * @param score New score to record
     */
    function updateLeaderboard(address player, uint256 score) internal {
        // Simple leaderboard implementation
        // In production, you might want a more sophisticated ranking system
        
        if (score > 0) {
            leaderboard[score]++;
            
            // Keep track of top players (simplified)
            if (topPlayers.length < 100) {
                bool alreadyExists = false;
                for (uint256 i = 0; i < topPlayers.length; i++) {
                    if (topPlayers[i] == player) {
                        alreadyExists = true;
                        break;
                    }
                }
                if (!alreadyExists) {
                    topPlayers.push(player);
                }
            }
        }
    }
    
    /**
     * @dev Get player statistics
     * @param player Address of the player
     * @return totalTaps Total number of taps
     * @return currentLevel Current player level
     * @return nftsMinted Number of NFTs minted
     * @return lastMintTimestamp Timestamp of last NFT mint
     * @return lastLevelUpTimestamp Timestamp of last level up
     */
    function getPlayerStats(address player) external view returns (
        uint256 totalTaps,
        uint256 currentLevel,
        uint256 nftsMinted,
        uint256 lastMintTimestamp,
        uint256 lastLevelUpTimestamp
    ) {
        Player storage p = players[player];
        return (p.totalTaps, p.currentLevel, p.nftsMinted, p.lastMintTimestamp, p.lastLevelUpTimestamp);
    }
    
    /**
     * @dev Check if a milestone is achieved for a player
     * @param player Address of the player
     * @param milestone Milestone threshold to check
     * @return True if milestone is achieved
     */
    function isMilestoneAchieved(address player, uint256 milestone) 
        external 
        view 
        returns (bool) {
        return players[player].milestonesAchieved[milestone];
    }
    
    /**
     * @dev Get next milestone for a player
     * @param player Address of the player
     * @return nextMilestone Next milestone threshold
     * @return remainingTaps Taps needed to reach next milestone
     */
    function getNextMilestone(address player) external view returns (
        uint256 nextMilestone,
        uint256 remainingTaps
    ) {
        uint256 currentTaps = players[player].totalTaps;
        
        for (uint256 i = 0; i < milestones.length; i++) {
            if (milestones[i] > currentTaps) {
                nextMilestone = milestones[i];
                remainingTaps = milestones[i] - currentTaps;
                return (nextMilestone, remainingTaps);
            }
        }
        
        return (0, 0); // All milestones achieved
    }
    
    /**
     * @dev Get top players (simplified implementation)
     * @return Array of top player addresses
     */
    function getTopPlayers() external view returns (address[] memory) {
        return topPlayers;
    }
    
    /**
     * @dev Get all milestones and rewards
     * @return _milestones Array of milestone thresholds
     * @return _rewards Array of corresponding rewards
     */
    function getMilestonesAndRewards() external view returns (
        uint256[] memory _milestones,
        uint256[] memory _rewards
    ) {
        return (milestones, rewards);
    }
    
    /**
     * @dev Withdraw contract balance (owner only)
     */
    function withdrawBalance() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Update milestone rewards (owner only)
     * @param newRewards New reward amounts for each milestone
     */
    function updateRewards(uint256[] calldata newRewards) external onlyOwner {
        require(newRewards.length == milestones.length, "Rewards array length mismatch");
        rewards = newRewards;
    }
    
    /**
     * @dev Emergency pause functionality (owner only)
     */
    function emergencyPause() external onlyOwner {
        // Implementation for emergency pause
        // This could include stopping minting, transfers, etc.
    }
    
    /**
     * @dev Override _baseURI for metadata
     */
    function _baseURI() internal pure override returns (string memory) {
        return "https://arbitrumgame.vercel.app/api/metadata/";
    }
    
    /**
     * @dev Required override for ERC721
     */
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(ERC721) 
        returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}
