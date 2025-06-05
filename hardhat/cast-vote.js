async function main() {
  try {
    const [voter] = await ethers.getSigners();
    console.log("Casting vote with the account:", voter.address);
  
    const balance = await voter.getBalance();
    console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
    
    // Check if account has enough funds
    if (balance.eq(ethers.constants.Zero)) {
      console.error("Error: Account has zero balance. Please fund your account before proceeding.");
      process.exit(1);
    }

    // Configuration - Get from arguments or environment
    const VOTE_CONTRACT_ADDRESS = process.env.VOTE_CONTRACT_ADDRESS;
    const OPTION_INDEX = process.env.OPTION_INDEX || 0; // Default to first option (Yes)
    
    if (!VOTE_CONTRACT_ADDRESS) {
      console.error("Error: VOTE_CONTRACT_ADDRESS must be set in the environment variables.");
      process.exit(1);
    }
    
    console.log("Using vote contract at:", VOTE_CONTRACT_ADDRESS);
    
    // Get contract instance
    const voteContract = await ethers.getContractAt("GraphiteVote", VOTE_CONTRACT_ADDRESS);
    
    // Check eligibility first
    console.log("Checking vote eligibility...");
    
    try {
      const canVote = await voteContract.canVote(voter.address);
      
      if (!canVote) {
        console.log("Getting eligibility details...");
        const eligibilityDetails = await voteContract.getEligibilityDetails(voter.address);
        
        console.log("\nEligibility Check Failed!");
        console.log("=======================");
        console.log("Active on Graphite:", eligibilityDetails.isActiveOnGraphite);
        console.log("KYC Level:", eligibilityDetails.userKycLevel.toString());
        console.log("Trust Score:", eligibilityDetails.userTrustScore.toString());
        console.log("Token Balance:", ethers.utils.formatEther(eligibilityDetails.userTokenBalance));
        console.log("Status:", eligibilityDetails.statusReason);
        
        console.error("\nError: Account is not eligible to vote on this proposal.");
        process.exit(1);
      }
      
      console.log("Account is eligible to vote!");
      
      // Get options to show what's being voted on
      console.log("\nVote Options:");
      const optionsCount = await voteContract.getOptionsCount();
      
      for (let i = 0; i < optionsCount; i++) {
        const option = await voteContract.getOption(i);
        const voteCount = await voteContract.getVoteCount(i);
        console.log(`[${i}] ${option}: ${voteCount} votes`);
      }
      
      console.log(`\nVoting for option index: ${OPTION_INDEX}`);
      
      // Cast the vote
      const tx = await voteContract.vote(OPTION_INDEX);
      
      console.log("Transaction sent:", tx.hash);
      console.log("Waiting for confirmation...");
      
      const receipt = await tx.wait();
      
      console.log("\nVote Cast Successfully!");
      console.log("=======================");
      console.log("Transaction confirmed in block:", receipt.blockNumber);
      
      // Find the Voted event
      const votedEvent = receipt.events.find(e => e.event === 'Voted');
      console.log("Voter:", votedEvent.args.voter);
      console.log("Option Index:", votedEvent.args.optionIndex.toString());
      
    } catch (error) {
      if (error.message.includes("NotEligibleToVote")) {
        console.error("\nError: Account is not eligible to vote on this proposal.");
        console.error("Reason:", error.message);
      } else if (error.message.includes("AlreadyVoted")) {
        console.error("\nError: Account has already voted on this proposal.");
      } else if (error.message.includes("VoteNotActive")) {
        console.error("\nError: This vote is not yet active.");
      } else if (error.message.includes("VoteEnded")) {
        console.error("\nError: This vote has ended.");
      } else {
        throw error;
      }
      process.exit(1);
    }
    
  } catch (error) {
    console.error("Vote casting failed with error:");
    console.error(error);
    process.exit(1);
  }
}
 
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Unhandled error during vote casting:");
    console.error(error);
    process.exit(1);
  }); 