require('@nomiclabs/hardhat-ethers');
require('dotenv').config();

async function main() {
  try {
    const [claimer] = await ethers.getSigners();
    console.log("Claiming airdrop with account:", claimer.address);
  
    const balance = await claimer.getBalance();
    console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
    
    // Get environment variables
    const ECOSYSTEM_ADDRESS = process.env.ECOSYSTEM_ADDRESS;
    const AIRDROP_ADDRESS = process.env.AIRDROP_ADDRESS;
    
    if (!ECOSYSTEM_ADDRESS || !AIRDROP_ADDRESS) {
      console.error("Error: ECOSYSTEM_ADDRESS and AIRDROP_ADDRESS must be set in the environment variables.");
      process.exit(1);
    }
    
    // Connect to ecosystem contract
    const EcosystemContract = await ethers.getContractFactory("GraphiteReputationEcosystem");
    const ecosystem = EcosystemContract.attach(ECOSYSTEM_ADDRESS);
    
    console.log("Connected to ecosystem at:", ECOSYSTEM_ADDRESS);
    console.log("Airdrop address:", AIRDROP_ADDRESS);
    
    // Check eligibility
    console.log("Checking eligibility...");
    const userDetails = await ecosystem.getUserDetails(claimer.address, AIRDROP_ADDRESS);
    console.log("User trust score:", userDetails.trustScore.toString());
    console.log("User tier:", userDetails.trustTier);
    console.log("Eligible for airdrop:", userDetails.eligibleForAirdrop);
    console.log("Already claimed:", userDetails.hasClaimedAirdrop);
    
    if (userDetails.hasClaimedAirdrop) {
      console.log("You have already claimed this airdrop. Exiting...");
      return;
    }
    
    if (!userDetails.eligibleForAirdrop) {
      console.log("You are not eligible for this airdrop. Trust score may be too low or KYC level insufficient.");
      return;
    }
    
    // Hardcoded example proof and amount
    // In a real scenario, you would generate this based on your address
    // This is just a placeholder - replace with your actual values
    const amount = ethers.utils.parseEther("1000");
    
    // This is just an example proof - you need to use the actual proof for your address
    // from the Merkle tree used to create the airdrop
    const proof = [
      "0x3c80b1060be6222bd97cae822cd259be3248023a46f9a6ca7b82f21d4c5f4646",
      "0x2df5ce5a0f5112af0ebf79933060695e845039c568c55fb331b359fb88e6c3d0"
    ];
    
    console.log("Attempting to claim airdrop...");
    console.log("Amount:", ethers.utils.formatEther(amount));
    
    // Claim airdrop through ecosystem contract
    const tx = await ecosystem.claimAirdrop(
      AIRDROP_ADDRESS,
      amount,
      proof,
      {
        gasPrice: ethers.utils.parseUnits("200", "gwei"),
        gasLimit: 300000
      }
    );
    
    console.log("Transaction sent:", tx.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("Airdrop claimed successfully!");
    
    // Check token balance
    const airdrop = await ethers.getContractAt("SybilResistantAirdrop", AIRDROP_ADDRESS);
    const tokenAddress = await airdrop.token();
    const token = await ethers.getContractAt("IERC20", tokenAddress);
    const tokenBalance = await token.balanceOf(claimer.address);
    console.log("Token balance after claim:", ethers.utils.formatEther(tokenBalance));
    
  } catch (error) {
    console.error("Failed to claim airdrop with error:");
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