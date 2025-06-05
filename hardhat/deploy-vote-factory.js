async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying Vote Factory with the account:", deployer.address);
  
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
    
    if (!ADAPTER_ADDRESS) {
      console.error("Error: ADAPTER_ADDRESS must be set in the environment variables.");
      console.error("Please deploy the GraphiteTrustScoreAdapter first and set its address in the .env file.");
      process.exit(1);
    }
    
    console.log("Using previously deployed adapter at:", ADAPTER_ADDRESS);
    
    // Deploy GraphiteVoteFactory
    console.log("Deploying GraphiteVoteFactory...");
    const VoteFactoryContract = await ethers.getContractFactory("GraphiteVoteFactory");
    
    const voteFactory = await VoteFactoryContract.deploy(
      ADAPTER_ADDRESS            // trustScoreAdapter (using our adapter)
    );
    
    await voteFactory.deployed();
    console.log("GraphiteVoteFactory deployed to:", voteFactory.address);
    
    // Log deployed address
    console.log("\nDeployment Summary:");
    console.log("====================");
    console.log("GraphiteTrustScoreAdapter:", ADAPTER_ADDRESS);
    console.log("GraphiteVoteFactory:", voteFactory.address);
    console.log("\nNext steps:");
    console.log("1. Update the VOTE_FACTORY_ADDRESS variable in your .env file with:", voteFactory.address);
    
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