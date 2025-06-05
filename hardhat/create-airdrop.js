require('@nomiclabs/hardhat-ethers');
require('dotenv').config();
const keccak256 = require('keccak256');
const { MerkleTree } = require('merkletreejs');

async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Creating airdrop with account:", deployer.address);
  
    const balance = await deployer.getBalance();
    console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
    
    // Get environment variables
    const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS;
    
    if (!FACTORY_ADDRESS) {
      console.error("Error: FACTORY_ADDRESS must be set in the environment variables.");
      process.exit(1);
    }
    
    // Connect to factory contract
    const FactoryContract = await ethers.getContractFactory("GraphiteAirdropFactory");
    const factory = FactoryContract.attach(FACTORY_ADDRESS);
    
    console.log("Connected to factory at:", FACTORY_ADDRESS);
    
    // For this example, we'll create a simple mock token to airdrop
    console.log("Deploying a mock token for the airdrop...");
    const MockToken = await ethers.getContractFactory("MockToken");
    const mockToken = await MockToken.deploy("Mock Airdrop Token", "MAT", ethers.utils.parseEther("1000000"));
    await mockToken.deployed();
    console.log("Mock token deployed to:", mockToken.address);
    
    // Generate a simple merkle tree with a few addresses
    const addresses = [
      { address: deployer.address, amount: ethers.utils.parseEther("100") },
      { address: "0x1234567890123456789012345678901234567890", amount: ethers.utils.parseEther("50") },
      { address: "0x0987654321098765432109876543210987654321", amount: ethers.utils.parseEther("25") }
    ];
    
    // Create leaves for the merkle tree
    const leaves = addresses.map(item => 
      ethers.utils.solidityKeccak256(
        ["address", "uint256"], 
        [item.address, item.amount]
      )
    );
    
    // Create merkle tree
    const tree = new MerkleTree(leaves, keccak256, { sort: true });
    const root = tree.getHexRoot();
    
    console.log("Generated Merkle Root:", root);
    
    // Set the airdrop parameters
    const tokenAddress = mockToken.address;
    const merkleRoot = root;
    
    // Using minimal requirements for testing
    const requiredTrustScore = 100;  // Very low trust score requirement
    const requiredKYCLevel = 0;      // No KYC requirement
    
    // Set timing parameters
    const now = Math.floor(Date.now() / 1000);
    const startTime = now;
    const endTime = now + (30 * 24 * 60 * 60); // 30 days from now
    
    console.log("Creating airdrop with parameters:");
    console.log("- Token Address:", tokenAddress);
    console.log("- Required Trust Score:", requiredTrustScore);
    console.log("- Required KYC Level:", requiredKYCLevel);
    console.log("- Start Time:", new Date(startTime * 1000).toISOString());
    console.log("- End Time:", new Date(endTime * 1000).toISOString());
    
    // Create the airdrop
    const tx = await factory.createAirdrop(
      tokenAddress,
      merkleRoot,
      requiredTrustScore,
      requiredKYCLevel,
      startTime,
      endTime,
      {
        gasPrice: ethers.utils.parseUnits("200", "gwei"),
        gasLimit: 5000000
      }
    );
    
    console.log("Transaction sent:", tx.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("Airdrop created successfully!");
    
    // Extract the airdrop contract address from the event
    const airdropCreatedEvent = receipt.events.find(event => event.event === 'AirdropCreated');
    if (airdropCreatedEvent) {
      const airdropAddress = airdropCreatedEvent.args.airdropContract;
      console.log("Airdrop contract deployed at:", airdropAddress);
      
      // Transfer tokens to the airdrop contract
      const totalAirdropAmount = ethers.utils.parseEther("175"); // Sum of all amounts in our list
      console.log("Transferring", ethers.utils.formatEther(totalAirdropAmount), "tokens to the airdrop contract...");
      
      const transferTx = await mockToken.transfer(airdropAddress, totalAirdropAmount);
      await transferTx.wait();
      console.log("Tokens transferred to airdrop contract successfully!");
    }
    
  } catch (error) {
    console.error("Failed to create airdrop with error:");
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