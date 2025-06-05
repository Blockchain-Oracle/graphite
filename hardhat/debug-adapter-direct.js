require('@nomiclabs/hardhat-ethers');
require('dotenv').config();

async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Debugging adapter for account:", deployer.address);
  
    // Get environment variables
    const ADAPTER_ADDRESS = process.env.ADAPTER_ADDRESS;
    console.log("Adapter address:", ADAPTER_ADDRESS);
    
    // Get contract code
    const provider = ethers.provider;
    const code = await provider.getCode(ADAPTER_ADDRESS);
    console.log("Contract bytecode length:", code.length);
    
    // Connect to contracts
    const adapter = await ethers.getContractAt("GraphiteTrustScoreAdapter", ADAPTER_ADDRESS);
    
    // Attempt to detect if this is our implementation or a different one
    console.log("\nChecking behavior with test values...");
    
    // Test with different addresses to see if there's any pattern
    const testAddresses = [
      deployer.address,
      "0x1234567890123456789012345678901234567890",
      "0x0000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000000"
    ];
    
    for (const addr of testAddresses) {
      const trustScore = await adapter.getTrustScore(addr);
      console.log(`Trust score for ${addr}: ${trustScore.toString()}`);
      
      try {
        const rawScore = await provider.call({
          to: "0x0000000000000000000000000000000000001008",
          data: ethers.utils.id("getReputation(address)").slice(0, 10) + 
                ethers.utils.defaultAbiCoder.encode(["address"], [addr]).slice(2)
        });
        
        const reputation = ethers.BigNumber.from(rawScore);
        console.log(`Raw reputation: ${reputation} (${ethers.utils.formatUnits(reputation, 18)})`);
        console.log(`Expected trust score (rep * 154): ${reputation.mul(154)}`);
      } catch (error) {
        console.log(`Error calling reputation contract: ${error.message}`);
      }
      console.log("---");
    }

    // Let's try to directly look at the adapter code
    console.log("\nLooking at adapter code...");
    const sourceBytecode = await provider.getCode(ADAPTER_ADDRESS);
    const hasTrustScoreLimit = sourceBytecode.includes("03e8"); // Check for 1000 (hex: 03e8) in bytecode
    console.log("Bytecode contains 1000 (03e8):", hasTrustScoreLimit);
    
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