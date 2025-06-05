async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
  
    const balance = await deployer.getBalance();
    console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
    
    // Check if account has enough funds
    if (balance.eq(ethers.constants.Zero)) {
      console.error("Error: Account has zero balance. Please fund your account before deploying.");
      process.exit(1);
    }

    console.log("Deploying with gas price:", ethers.utils.formatUnits(await ethers.provider.getGasPrice(), "gwei"), "gwei");
    
    // Configuration
    const ADAPTER_ADDRESS = process.env.ADAPTER_ADDRESS;
    const FEE_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000001000";
    
    if (!ADAPTER_ADDRESS) {
      console.error("Error: ADAPTER_ADDRESS must be set in the environment variables.");
      console.error("Please deploy the GraphiteTrustScoreAdapter first and set its address in the .env file.");
      process.exit(1);
    }
    
    console.log("Using previously deployed adapter at:", ADAPTER_ADDRESS);
    
    // Deploy GraphiteAirdropFactory
    console.log("Deploying GraphiteAirdropFactory...");
    const AirdropFactoryContract = await ethers.getContractFactory("GraphiteAirdropFactory");
    
    const airdropFactory = await AirdropFactoryContract.deploy(
      ADAPTER_ADDRESS,            // trustScoreAdapter (using our adapter)
      FEE_CONTRACT_ADDRESS        // Fee contract (which is also the activation contract)
    );
    
    await airdropFactory.deployed();
    console.log("GraphiteAirdropFactory deployed to:", airdropFactory.address);
    
    // Log deployed address
    console.log("\nDeployment Summary:");
    console.log("====================");
    console.log("GraphiteTrustScoreAdapter:", ADAPTER_ADDRESS);
    console.log("GraphiteAirdropFactory:", airdropFactory.address);
    console.log("\nNext steps:");
    console.log("1. Update the FACTORY_ADDRESS variable in your .env file with:", airdropFactory.address);
    console.log("2. Deploy the ecosystem using deploy-ecosystem.js");
    
  } catch (error) {
    console.error("Deployment failed with error:");
    console.error(error);
    process.exit(1);
  }
}
 
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Unhandled error during deployment:");
    console.error(error);
    process.exit(1);
  }); 