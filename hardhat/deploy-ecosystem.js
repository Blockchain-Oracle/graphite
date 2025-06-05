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
    const MINT_COST = ethers.utils.parseEther("0.01");
    
    // These addresses should be taken from previous deployment steps
    // Use the addresses from your successful deployments
    const ADAPTER_ADDRESS = process.env.ADAPTER_ADDRESS;
    const NFT_ADDRESS = process.env.NFT_ADDRESS;
    const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS;
    
    if (!NFT_ADDRESS || !FACTORY_ADDRESS || !ADAPTER_ADDRESS) {
      console.error("Error: NFT_ADDRESS, FACTORY_ADDRESS, and ADAPTER_ADDRESS must be set in the environment variables.");
      console.error("Please deploy the adapter, NFT and Factory contracts first and set their addresses in the .env file.");
      process.exit(1);
    }
    
    console.log("Using previously deployed contracts:");
    console.log("GraphiteTrustScoreAdapter:", ADAPTER_ADDRESS);
    console.log("GraphiteTrustNFT:", NFT_ADDRESS);
    console.log("GraphiteAirdropFactory:", FACTORY_ADDRESS);
    
    // Deploy GraphiteReputationEcosystem
    console.log("Deploying GraphiteReputationEcosystem...");
    const EcosystemContract = await ethers.getContractFactory("GraphiteReputationEcosystem");
    
    const ecosystem = await EcosystemContract.deploy(
      FACTORY_ADDRESS,            // airdropFactory
      NFT_ADDRESS,                // trustNFT
      ADAPTER_ADDRESS,            // trustScoreContract (using our adapter)
      MINT_COST                   // mintCost
    );
    
    await ecosystem.deployed();
    console.log("GraphiteReputationEcosystem deployed to:", ecosystem.address);
    
    // Log deployed addresses
    console.log("\nDeployment Summary:");
    console.log("====================");
    console.log("GraphiteTrustScoreAdapter:", ADAPTER_ADDRESS);
    console.log("GraphiteTrustNFT:", NFT_ADDRESS);
    console.log("GraphiteAirdropFactory:", FACTORY_ADDRESS);
    console.log("GraphiteReputationEcosystem:", ecosystem.address);
    console.log("\nNext step: Update the ECOSYSTEM_ADDRESS variable in your .env file with:", ecosystem.address);
    console.log("Then run the transfer-ownership.js script to transfer ownership of the NFT to the ecosystem.");
    
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