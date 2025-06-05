require('@nomiclabs/hardhat-ethers');
require('dotenv').config();

async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Minting NFT with the account:", deployer.address);
  
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
    
    // Get mint cost
    const mintCost = await ecosystem.mintCost();
    console.log("Current mint cost:", ethers.utils.formatEther(mintCost), "ETH");
    
    // Get trust score
    const trustScoreContract = await ethers.getContractAt(
      "IGraphiteTrustScore", 
      await ecosystem.trustScoreContract()
    );
    
    const trustScore = await trustScoreContract.getTrustScore(deployer.address);
    console.log("Current trust score:", trustScore.toString());
    
    // Mint the NFT through ecosystem
    console.log("Minting NFT through ecosystem...");
    const tx = await ecosystem.mintNFT({
      value: mintCost,
      gasPrice: ethers.utils.parseUnits("200", "gwei"),
      gasLimit: 500000
    });
    
    console.log("Transaction sent:", tx.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("NFT minted successfully!");
    
    // Get the token ID from events
    const mintEvent = receipt.events.find(event => event.event === 'NFTMinted');
    if (mintEvent) {
      const tokenId = mintEvent.args.tokenId;
      console.log("Token ID:", tokenId.toString());
      
      // Get NFT contract
      const nftContract = await ethers.getContractAt(
        "GraphiteTrustNFT", 
        await ecosystem.trustNFT()
      );
      
      // Get badge data
      const badgeData = await nftContract.getBadgeData(tokenId);
      console.log("Badge Type:", badgeData.badgeType.toString());
      console.log("Badge Name:", badgeData.badgeName || "(No name set)");
      console.log("Badge Message:", badgeData.badgeMessage || "(No message set)");
      
      // Get token URI
      const tokenURI = await nftContract.tokenURI(tokenId);
      console.log("Token URI:", tokenURI);
    }
    
  } catch (error) {
    console.error("Minting failed with error:");
    console.error(error);
    process.exit(1);
  }
}
 
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Unhandled error during minting:");
    console.error(error);
    process.exit(1);
  }); 