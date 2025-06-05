require('@nomiclabs/hardhat-ethers');
require('dotenv').config();

async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying MockToken with the account:", deployer.address);
  
    const balance = await deployer.getBalance();
    console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
    
    // Deploy MockToken
    console.log("Deploying MockToken...");
    const MockToken = await ethers.getContractFactory("MockToken");
    const mockToken = await MockToken.deploy(
      "Test Graphite Token", 
      "TGT", 
      ethers.utils.parseEther("1000000") // 1 million tokens
    );
    await mockToken.deployed();
    
    console.log("MockToken deployed to:", mockToken.address);
    console.log("Token details:");
    console.log("  Name:", await mockToken.name());
    console.log("  Symbol:", await mockToken.symbol());
    console.log("  Decimals:", await mockToken.decimals());
    console.log("  Total Supply:", ethers.utils.formatEther(await mockToken.totalSupply()));
    
  } catch (error) {
    console.error("Deployment failed with error:");
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