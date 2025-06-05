async function main() {
  try {
    const [creator] = await ethers.getSigners();
    console.log("Creating vote with the account:", creator.address);
  
    const balance = await creator.getBalance();
    console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
    
    // Check if account has enough funds
    if (balance.eq(ethers.constants.Zero)) {
      console.error("Error: Account has zero balance. Please fund your account before proceeding.");
      process.exit(1);
    }

    // Configuration
    const VOTE_FACTORY_ADDRESS = process.env.VOTE_FACTORY_ADDRESS;
    const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || ethers.constants.AddressZero; // Optional ERC20 token requirement
    
    if (!VOTE_FACTORY_ADDRESS) {
      console.error("Error: VOTE_FACTORY_ADDRESS must be set in the environment variables.");
      process.exit(1);
    }
    
    console.log("Using vote factory at:", VOTE_FACTORY_ADDRESS);
    
    // Get contract instances
    const voteFactory = await ethers.getContractAt("GraphiteVoteFactory", VOTE_FACTORY_ADDRESS);
    
    // Example vote parameters
    const description = "Should we implement feature X?";
    const options = ["Yes", "No", "Abstain"];
    const startTime = Math.floor(Date.now() / 1000); // Now
    const endTime = startTime + (7 * 24 * 60 * 60); // 1 week from now
    const requiredTokenBalance = ethers.utils.parseEther("0"); // No tokens required by default
    const requiredTrustScore = 0; // Minimum trust score (0-1000)
    const requiredKYCLevel = 1; // Minimum KYC level (e.g., 1)
    
    console.log("Creating vote with the following parameters:");
    console.log("Description:", description);
    console.log("Options:", options);
    console.log("Start time:", new Date(startTime * 1000).toLocaleString());
    console.log("End time:", new Date(endTime * 1000).toLocaleString());
    console.log("Required token:", TOKEN_ADDRESS);
    console.log("Required token balance:", ethers.utils.formatEther(requiredTokenBalance));
    console.log("Required trust score:", requiredTrustScore);
    console.log("Required KYC level:", requiredKYCLevel);
    
    // Create the vote
    console.log("\nCreating vote...");
    const tx = await voteFactory.createVote(
      description,
      options,
      startTime,
      endTime,
      TOKEN_ADDRESS,
      requiredTokenBalance,
      requiredTrustScore,
      requiredKYCLevel
    );
    
    console.log("Transaction sent:", tx.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("Vote created! Transaction confirmed in block:", receipt.blockNumber);
    
    // Find the VoteCreated event to get the vote contract address
    const voteCreatedEvent = receipt.events.find(e => e.event === 'VoteCreated');
    const voteContractAddress = voteCreatedEvent.args.voteContract;
    
    console.log("\nVote Created Successfully!");
    console.log("=======================");
    console.log("Vote Contract Address:", voteContractAddress);
    console.log("Creator:", voteCreatedEvent.args.creator);
    
  } catch (error) {
    console.error("Vote creation failed with error:");
    console.error(error);
    process.exit(1);
  }
}
 
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Unhandled error during vote creation:");
    console.error(error);
    process.exit(1);
  }); 