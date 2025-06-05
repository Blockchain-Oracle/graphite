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
    const REPUTATION_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000001008"; // Correct Graphite Reputation address
    const NFT_NAME = "Graphite Trust NFT";
    const NFT_SYMBOL = "GTRUST";
    const BASE_URI = "https://happy-viper-factual.ngrok-free.app/api";
    const METADATA_SERVER = "https://happy-viper-factual.ngrok-free.app/view";
    
    // First deploy the TrustScore adapter
    console.log("Deploying GraphiteTrustScoreAdapter...");
    const AdapterContract = await ethers.getContractFactory("GraphiteTrustScoreAdapter");
    const trustScoreAdapter = await AdapterContract.deploy();
    
    await trustScoreAdapter.deployed();
    console.log("GraphiteTrustScoreAdapter deployed to:", trustScoreAdapter.address);
    
    // Deploy GraphiteTrustNFT using the adapter
    console.log("Deploying GraphiteTrustNFT...");
    const NFTContract = await ethers.getContractFactory("GraphiteTrustNFT");
    
    const trustNFT = await NFTContract.deploy(
      NFT_NAME,                       // name
      NFT_SYMBOL,                     // symbol
      trustScoreAdapter.address,      // trustScoreContract (using our adapter)
      BASE_URI,                       // baseURI
      METADATA_SERVER                 // metadataServer
    );
    
    await trustNFT.deployed();
    console.log("GraphiteTrustNFT deployed to:", trustNFT.address);
    
    // Log deployed addresses
    console.log("\nDeployment Summary:");
    console.log("====================");
    console.log("GraphiteTrustScoreAdapter:", trustScoreAdapter.address);
    console.log("GraphiteTrustNFT:", trustNFT.address);
    console.log("\nNext steps:");
    console.log("1. Update the ADAPTER_ADDRESS variable in your .env file with:", trustScoreAdapter.address);
    console.log("2. Update the NFT_ADDRESS variable in your .env file with:", trustNFT.address);
    console.log("3. Deploy the factory using deploy-factory.js");
    
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