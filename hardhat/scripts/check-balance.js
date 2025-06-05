async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Checking balance for account:", deployer.address);
  
    const balance = await deployer.getBalance();
    console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
    
    // Check if account has enough funds for deployment
    const requiredBalance = ethers.utils.parseEther("0.5"); // 0.5 ETH
    if (balance.lt(requiredBalance)) {
      console.warn("Warning: Balance may be too low for deployment");
      console.warn("Recommended minimum balance: 0.5 ETH for each step");
    } else {
      console.log("Balance is sufficient for at least one deployment step");
    }
    
    // Check network gas price
    const gasPrice = await ethers.provider.getGasPrice();
    console.log("Current network gas price:", ethers.utils.formatUnits(gasPrice, "gwei"), "gwei");
    
    // Estimate approximate deployment cost
    const estimatedGas = 2000000; // Approximate gas for NFT deployment
    const estimatedCost = gasPrice.mul(estimatedGas);
    console.log("Estimated deployment cost for NFT:", ethers.utils.formatEther(estimatedCost), "ETH");
    
  } catch (error) {
    console.error("Error checking balance:");
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