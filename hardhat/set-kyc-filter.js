require('@nomiclabs/hardhat-ethers');
require('dotenv').config();

async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Setting KYC filter for account:", deployer.address);
  
    const balance = await deployer.getBalance();
    console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
    
    // Get environment variables
    const ECOSYSTEM_ADDRESS = process.env.ECOSYSTEM_ADDRESS;
    
    if (!ECOSYSTEM_ADDRESS) {
      console.error("Error: ECOSYSTEM_ADDRESS must be set in the environment variables.");
      process.exit(1);
    }
    
    // Connect to ecosystem contract
    const EcosystemContract = await ethers.getContractFactory("GraphiteReputationEcosystem");
    const ecosystem = EcosystemContract.attach(ECOSYSTEM_ADDRESS);
    
    // Set KYC filter level to 1 (basic KYC)
    const kycLevel = 1;
    console.log("Setting KYC filter level to:", kycLevel);
    const tx = await ecosystem.setKYCFilter(kycLevel, {
      gasPrice: ethers.utils.parseUnits("200", "gwei"),
      gasLimit: 300000
    });
    
    console.log("Transaction sent:", tx.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("KYC filter level set successfully!");
    
  } catch (error) {
    console.error("Failed to set KYC filter level with error:");
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