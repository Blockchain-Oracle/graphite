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
    const TRUST_SCORE_ADAPTER_ADDRESS = process.env.ADAPTER_ADDRESS;
    const NFT_NAME = "Graphite Trust NFT";
    const NFT_SYMBOL = "GTRUST";
    const BASE_URI = "https://graphite-nft-api.example.com/";
    const VIEWER_URL = "https://graphite-nft-viewer.example.com/view";
    
    // 1. Deploy GraphiteTrustNFT
    console.log("Deploying GraphiteTrustNFT...");
    const NFTContract = await ethers.getContractFactory("GraphiteTrustNFT");
    
    const trustNFT = await NFTContract.deploy(
      NFT_NAME,                   // name
      NFT_SYMBOL,                 // symbol
      TRUST_SCORE_ADAPTER_ADDRESS,        // trustScoreContract
      BASE_URI,                   // baseURI
      VIEWER_URL                  // metadataServer
    );
    
    await trustNFT.deployed();
    console.log("GraphiteTrustNFT deployed to:", trustNFT.address);
    
    // Log deployed addresses
    console.log("\nDeployment Summary:");
    console.log("====================");
    console.log("GraphiteTrustNFT:", trustNFT.address);
    console.log("Save this address for use in the next deployment steps!");
    
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