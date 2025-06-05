async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Account:", deployer.address);
  
    const balance = await deployer.getBalance();
    console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
    
    // Get the addresses from environment variables
    const NFT_ADDRESS = process.env.NFT_ADDRESS;
    const ECOSYSTEM_ADDRESS = process.env.ECOSYSTEM_ADDRESS;
    
    if (!NFT_ADDRESS || !ECOSYSTEM_ADDRESS) {
      console.error("Error: NFT_ADDRESS and ECOSYSTEM_ADDRESS must be set in the environment variables.");
      console.error("Please deploy all contracts first and set their addresses in the .env file.");
      process.exit(1);
    }
    
    console.log("Transferring ownership of NFT contract to ecosystem...");
    console.log("NFT Address:", NFT_ADDRESS);
    console.log("Ecosystem Address:", ECOSYSTEM_ADDRESS);
    
    // Use a lower gas limit for just the ownership transfer
    const options = {
      gasLimit: 300000,  // Much lower than deployment
      gasPrice: ethers.utils.parseUnits("200", "gwei")
    };
    
    const NFTContract = await ethers.getContractFactory("GraphiteTrustNFT");
    const trustNFT = NFTContract.attach(NFT_ADDRESS);
    
    const transferTx = await trustNFT.transferOwnership(ECOSYSTEM_ADDRESS, options);
    console.log("Transaction sent:", transferTx.hash);
    console.log("Waiting for confirmation...");
    
    await transferTx.wait();
    console.log("Ownership transferred successfully");
    
    console.log("\nDeployment Complete!");
    console.log("====================");
    console.log("GraphiteTrustNFT:", NFT_ADDRESS);
    console.log("GraphiteAirdropFactory:", process.env.FACTORY_ADDRESS);
    console.log("GraphiteReputationEcosystem:", ECOSYSTEM_ADDRESS);
    console.log("Ecosystem now owns the NFT contract");
    
  } catch (error) {
    console.error("Transfer failed with error:");
    console.error(error);
    process.exit(1);
  }
}
 
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Unhandled error during transfer:");
    console.error(error);
    process.exit(1);
  }); 