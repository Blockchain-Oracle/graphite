require('@nomiclabs/hardhat-ethers');
require('dotenv').config();

async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Comparing adapters for account:", deployer.address);
  
    // Get environment variables
    const ORIGINAL_ADAPTER_ADDRESS = process.env.ADAPTER_ADDRESS;
    const TEST_ADAPTER_ADDRESS = process.env.TEST_ADAPTER_ADDRESS;
    
    console.log(`Original adapter: ${ORIGINAL_ADAPTER_ADDRESS}`);
    console.log(`Test adapter: ${TEST_ADAPTER_ADDRESS}`);
    
    // Connect to contracts
    const originalAdapter = await ethers.getContractAt("IGraphiteTrustScore", ORIGINAL_ADAPTER_ADDRESS);
    const testAdapter = await ethers.getContractAt("IGraphiteTrustScore", TEST_ADAPTER_ADDRESS);
    const reputationContract = await ethers.getContractAt(
      "IGraphiteReputation", 
      "0x0000000000000000000000000000000000001008"
    );
    
    // Test addresses
    const testAddresses = [
      deployer.address,
      "0x1234567890123456789012345678901234567890",
      "0x0987654321098765432109876543210987654321",
      "0x0000000000000000000000000000000000000001"
    ];
    
    console.log("\nComparing trust scores for different addresses:");
    console.log("-------------------------------------------------");
    console.log("Address | Raw Reputation | Expected (scaled) | Original Adapter | Test Adapter");
    console.log("-------------------------------------------------");
    
    // Constants for scaling
    const MAX_REPUTATION = 650;
    const MAX_TRUST_SCORE = 1000;
    
    for (const addr of testAddresses) {
      const rawReputation = await reputationContract.getReputation(addr);
      // Calculate expected score with our scaling formula
      const expectedScore = rawReputation.mul(MAX_TRUST_SCORE).div(MAX_REPUTATION);
      const originalTrustScore = await originalAdapter.getTrustScore(addr);
      const testTrustScore = await testAdapter.getTrustScore(addr);
      
      console.log(
        `${addr.slice(0, 8)}... | ${rawReputation} | ${expectedScore} | ${originalTrustScore} | ${testTrustScore}`
      );
    }
    
    console.log("\nScaling Explanation:");
    console.log("- Graphite Reputation returns values from 0 to ~650");
    console.log("- Our tier system requires scores from 0 to 1000");
    console.log("- We scale using: trustScore = (reputationScore * 1000) / 650");
    console.log("- This ensures the maximum reputation (650) maps to trust score 1000");
    console.log("- All tier levels (including Elite at 800+) are now achievable");
    
  } catch (error) {
    console.error("Comparison failed with error:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Unhandled error:", error);
    process.exit(1);
  }); 