require('@nomiclabs/hardhat-ethers');
require('dotenv').config();

async function main() {
  try {
    // Get environment variables
    const ADAPTER_ADDRESS = process.env.ADAPTER_ADDRESS;
    const ECOSYSTEM_ADDRESS = process.env.ECOSYSTEM_ADDRESS;
    
    const [deployer] = await ethers.getSigners();
    console.log("Querying information for account:", deployer.address);
  
    const balance = await deployer.getBalance();
    console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
    
    // Connect to adapter contract
    console.log("\nConnecting to Trust Score Adapter at:", ADAPTER_ADDRESS);
    const AdapterContract = await ethers.getContractAt("IGraphiteTrustScore", ADAPTER_ADDRESS);
    
    // Connect to ecosystem contract
    console.log("Connecting to Ecosystem contract at:", ECOSYSTEM_ADDRESS);
    
    // Get trust score
    console.log("\nQuerying trust score...");
    try {
      const trustScore = await AdapterContract.getTrustScore(deployer.address);
      console.log("Trust Score:", trustScore.toString());
      
      // Get tier level
      const tierLevel = await AdapterContract.getTierLevel(trustScore);
      console.log("Tier Level:", tierLevel.toString());
      
      // Check if meets trust threshold
      const meetsThreshold = await AdapterContract.meetsTrustThreshold(deployer.address, 500);
      console.log("Meets 500 Trust Threshold:", meetsThreshold);
    } catch (error) {
      console.log("Error querying trust score:", error.message);
    }
    
    // Try to query the Graphite Reputation contract directly
    console.log("\nQuerying Graphite Reputation contract...");
    try {
      const ReputationContract = await ethers.getContractAt(
        "IGraphiteReputation", 
        "0x0000000000000000000000000000000000001008"
      );
      
      const reputationScore = await ReputationContract.getReputation(deployer.address);
      console.log("Reputation Score:", ethers.utils.formatUnits(reputationScore, 18));
    } catch (error) {
      console.log("Error querying reputation:", error.message);
    }
    
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Unhandled error:", error);
    process.exit(1);
  }); 