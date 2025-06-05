require('@nomiclabs/hardhat-ethers');
require('dotenv').config();

async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Checking details for account:", deployer.address);
  
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
    
    // Get user details
    console.log("Getting user details...");
    const details = await ecosystem.getUserDetails(deployer.address, ethers.constants.AddressZero);
    
    console.log("\nUser Details:");
    console.log("====================");
    console.log("Trust Score:", details.trustScore.toString());
    console.log("Trust Tier:", details.trustTier);
    console.log("Tier Level:", details.tierLevel.toString());
    console.log("Eligible For Airdrop:", details.eligibleForAirdrop);
    console.log("Has Claimed Airdrop:", details.hasClaimedAirdrop);
    console.log("Reputation Score:", ethers.utils.formatUnits(details.reputationScore, 18));
    console.log("Is Activated:", details.isActivated);
    console.log("KYC Level:", details.kycLevel.toString());
    console.log("KYC Filter Level:", details.kycFilterLevel.toString());
    
  } catch (error) {
    console.error("Failed to get user details with error:");
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