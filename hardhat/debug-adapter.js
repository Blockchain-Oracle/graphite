require('@nomiclabs/hardhat-ethers');
require('dotenv').config();

async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Debugging adapter for account:", deployer.address);
  
    // Get environment variables
    const ADAPTER_ADDRESS = process.env.ADAPTER_ADDRESS;
    console.log("Adapter address:", ADAPTER_ADDRESS);
    
    // Connect to contracts
    const adapter = await ethers.getContractAt("GraphiteTrustScoreAdapter", ADAPTER_ADDRESS);
    
    // Get direct reputation score from hardcoded contract address
    const reputationContract = await ethers.getContractAt(
      "IGraphiteReputation", 
      "0x0000000000000000000000000000000000001008"
    );
    
    const rawReputation = await reputationContract.getReputation(deployer.address);
    console.log("Raw reputation from Graphite contract:", rawReputation.toString());
    console.log("(This value is already scaled by 100, max expected value is ~650)");
    
    // Get trust score from adapter
    const trustScore = await adapter.getTrustScore(deployer.address);
    console.log("Trust score from adapter:", trustScore.toString());
    
    // Calculate expected score with our scaling formula
    const MAX_REPUTATION = 650;
    const MAX_TRUST_SCORE = 1000;
    const expectedScore = Math.min(
      Math.floor((rawReputation * MAX_TRUST_SCORE) / MAX_REPUTATION),
      MAX_TRUST_SCORE
    );
    console.log("Expected trust score with scaling:", expectedScore);
    
    // Get tier level
    const tierLevel = await adapter.getTierLevel(trustScore);
    console.log("Tier level:", tierLevel.toString());
    
    // Check if using this contract address actually matters
    const REPUTATION_CONTRACT_ADDRESS = await adapter.REPUTATION_CONTRACT_ADDRESS();
    console.log("Hardcoded reputation contract in adapter:", REPUTATION_CONTRACT_ADDRESS);
    
    // Explain the scaling
    console.log("\nScaling Explanation:");
    console.log("- Graphite Reputation returns values from 0 to ~650");
    console.log("- Our tier system requires scores from 0 to 1000");
    console.log("- We scale using: trustScore = (reputationScore * 1000) / 650");
    console.log("- This ensures the maximum reputation (650) maps to trust score 1000");
    console.log("- All tier levels (including Elite at 800+) are now achievable");
    
  } catch (error) {
    console.error("Debug failed with error:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Unhandled error:", error);
    process.exit(1);
  }); 