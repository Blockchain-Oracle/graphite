require('@nomiclabs/hardhat-ethers');
require('dotenv').config();

async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying TestAdapter with the account:", deployer.address);
  
    const balance = await deployer.getBalance();
    console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
    
    // Deploy TestAdapter
    console.log("Deploying TestAdapter...");
    const TestAdapter = await ethers.getContractFactory("TestAdapter");
    const adapter = await TestAdapter.deploy();
    await adapter.deployed();
    
    console.log("TestAdapter deployed to:", adapter.address);
    
    // Test the adapter with our address
    const trustScore = await adapter.getTrustScore(deployer.address);
    console.log("Trust score from new adapter:", trustScore.toString());
    
    // Get tier level
    const tierLevel = await adapter.getTierLevel(trustScore);
    console.log("Tier level:", tierLevel.toString());
    
    // Compare with direct reputation call
    const reputationContract = await ethers.getContractAt(
      "IGraphiteReputation", 
      "0x0000000000000000000000000000000000001008"
    );
    
    const rawReputation = await reputationContract.getReputation(deployer.address);
    console.log("Raw reputation from Graphite contract:", rawReputation.toString());
    console.log("Formatted with 18 decimals:", ethers.utils.formatUnits(rawReputation, 18));
    
    // Update .env file with the new adapter address
    console.log("\nPlease update your .env file with the following:");
    console.log(`TEST_ADAPTER_ADDRESS=${adapter.address}`);
    
  } catch (error) {
    console.error("Deployment failed with error:");
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Unhandled error:");
    console.error(error);
    process.exit(1);
  }); 