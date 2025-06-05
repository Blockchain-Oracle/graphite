require('@nomiclabs/hardhat-ethers');
require('dotenv').config();
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const fs = require('fs'); // Added for writing to env file

async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer account:", deployer.address);

    const initialBalance = await deployer.getBalance();
    console.log("Initial ETH balance:", ethers.utils.formatEther(initialBalance), "ETH");

    const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS;
    if (!FACTORY_ADDRESS) {
      console.error("Error: FACTORY_ADDRESS must be set in the environment variables.");
      process.exit(1);
    }
    console.log(`Using Airdrop Factory at: ${FACTORY_ADDRESS}`);

    const FactoryContract = await ethers.getContractFactory("GraphiteAirdropFactory");
    const factory = FactoryContract.attach(FACTORY_ADDRESS);
    console.log("Connected to Airdrop Factory successfully.");

    // Log factory configuration (outside the loop as it's constant)
    try {
      console.log("\n--- Factory Configuration ---");
      const factoryTrustScoreContract = await factory.trustScoreContract();
      console.log("Factory's trustScoreContract:", factoryTrustScoreContract);
      const factoryFeeContractAddress = await factory.feeContract();
      console.log("Factory's feeContract address:", factoryFeeContractAddress);
      const factoryKycContractAddress = await factory.kycContract();
      console.log("Factory's kycContract address:", factoryKycContractAddress);

      if (factoryFeeContractAddress && factoryFeeContractAddress !== ethers.constants.AddressZero) {
        const feeContract = await ethers.getContractAt("IGraphiteFee", factoryFeeContractAddress);
        const isFeePaid = await feeContract.paidFee(deployer.address);
        console.log(`Deployer's fee paid status (via factory's feeContract):`, isFeePaid);
      }
      if (factoryKycContractAddress && factoryKycContractAddress !== ethers.constants.AddressZero) {
        const kycContractInstance = await ethers.getContractAt("IGraphiteKYC", factoryKycContractAddress);
        const kycLevel = await kycContractInstance.level(deployer.address);
        console.log(`Deployer's KYC level (via factory's kycContract):`, kycLevel.toString());
      }
      console.log("---------------------------\n");
    } catch (e) {
      console.error("Error fetching factory configuration or deployer status:", e);
      // Decide if this is a fatal error for the whole script
    }
    
    const MockTokenContractFactory = await ethers.getContractFactory("MockToken");
    const numberOfAirdrops = 3;
    const baseTokenName = "GraphiteDropToken";
    const baseTokenSymbol = "GDT";
    const initialTokenSupply = ethers.utils.parseEther("2000"); // Mint 2000 tokens for the deployer
    const airdropSupplyAmount = ethers.utils.parseEther("1750"); // Amount to fund each airdrop

    for (let i = 0; i < numberOfAirdrops; i++) {
      console.log(`\n--- Creating Airdrop #${i + 1} ---`);

      // 1. Deploy a new MockToken
      const tokenName = `${baseTokenName}${i + 1}`;
      const tokenSymbol = `${baseTokenSymbol}${i + 1}`;
      console.log(`Deploying ${tokenName} (${tokenSymbol}) with initial supply of ${ethers.utils.formatEther(initialTokenSupply)} tokens for deployer...`);
      const mockToken = await MockTokenContractFactory.deploy(tokenName, tokenSymbol, initialTokenSupply);
      await mockToken.deployed();
      const TOKEN_ADDRESS = mockToken.address;
      console.log(`${tokenName} deployed to: ${TOKEN_ADDRESS}`);

      const deployerTokenBalance = await mockToken.balanceOf(deployer.address);
      console.log(`Deployer's balance of ${tokenSymbol}: ${ethers.utils.formatEther(deployerTokenBalance)}`);

      // 2. Generate Merkle Tree (same for each airdrop in this example)
      const addresses = [
        { address: deployer.address, amount: ethers.utils.parseEther("1000") },
        { address: "0x1234567890123456789012345678901234567890", amount: ethers.utils.parseEther("500") },
        { address: "0x0987654321098765432109876543210987654321", amount: ethers.utils.parseEther("250") }
      ];
      const leaves = addresses.map(item =>
        ethers.utils.solidityKeccak256(
          ["address", "uint256"],
          [item.address, item.amount]
        )
      );
      const tree = new MerkleTree(leaves, keccak256, { sort: true });
      const merkleRoot = tree.getHexRoot();
      console.log("Generated Merkle Root:", merkleRoot);

      // 3. Set Airdrop Parameters
      const requiredTrustScore = 100;
      const requiredKYCLevel = 1;
      const now = Math.floor(Date.now() / 1000);
      const startTime = now; // Start immediately
      const endTime = now + (30 * 24 * 60 * 60); // 30 days from now

      console.log("Airdrop parameters for this iteration:");
      console.log("- Token Address:", TOKEN_ADDRESS);
      console.log("- Required Trust Score:", requiredTrustScore);
      console.log("- Required KYC Level:", requiredKYCLevel);
      console.log("- Start Time:", new Date(startTime * 1000).toISOString());
      console.log("- End Time:", new Date(endTime * 1000).toISOString());

      // 4. Create the Airdrop using the factory
      console.log("Sending transaction to create airdrop via factory...");
      const createAirdropTx = await factory.createAirdrop(
        TOKEN_ADDRESS,
        merkleRoot,
        requiredTrustScore,
        requiredKYCLevel,
        startTime,
        endTime,
        {
          // Consider adjusting gas if needed, but Hardhat usually estimates well
          // gasPrice: ethers.utils.parseUnits("200", "gwei"), // Example from old script
          // gasLimit: 5000000 // Example from old script
        }
      );
      console.log(`Create Airdrop #${i + 1} transaction sent: ${createAirdropTx.hash}`);
      const receipt = await createAirdropTx.wait();
      console.log(`Airdrop #${i + 1} created successfully!`);

      const airdropCreatedEvent = receipt.events.find(event => event.event === 'AirdropCreated');
      if (!airdropCreatedEvent || !airdropCreatedEvent.args) {
        console.error(`Error: AirdropCreated event not found for airdrop #${i + 1}. Cannot proceed with funding.`);
        continue; // Skip to next iteration
      }
      const airdropAddress = airdropCreatedEvent.args.airdropContract;
      console.log(`SybilResistantAirdrop contract #${i + 1} deployed at: ${airdropAddress}`);

      // 5. Fund the new Airdrop contract
      console.log(`Transferring ${ethers.utils.formatEther(airdropSupplyAmount)} ${tokenSymbol} to airdrop contract ${airdropAddress}...`);
      const transferTx = await mockToken.transfer(airdropAddress, airdropSupplyAmount);
      console.log(`Token transfer transaction for Airdrop #${i + 1} sent: ${transferTx.hash}`);
      await transferTx.wait();
      console.log(`Tokens successfully transferred to Airdrop #${i + 1} contract!`);

      // 6. Log information (optional: save to .env or a deployment info file)
      console.log(`\n--- Airdrop #${i + 1} Summary ---`);
      console.log(`MockToken (${tokenSymbol}): ${TOKEN_ADDRESS}`);
      console.log(`Airdrop Contract: ${airdropAddress}`);
      
      // Append to .env file - simple append, might create duplicates if run multiple times without clearing
      const envEntry = `\n# Airdrop Iteration ${i + 1}\nTOKEN_ADDRESS_${i+1}=${TOKEN_ADDRESS}\nAIRDROP_ADDRESS_${i+1}=${airdropAddress}\n`;
      fs.appendFileSync('.env', envEntry); // Corrected path to be relative to Hardhat project root
      console.log(`Airdrop #${i + 1} details appended to .env`);


      // Proof for deployer for this airdrop
      const deployerLeaf = ethers.utils.solidityKeccak256(
        ["address", "uint256"],
        [deployer.address, ethers.utils.parseEther("1000")]
      );
      const deployerProof = tree.getHexProof(deployerLeaf);
      console.log(`\nTo claim tokens from Airdrop #${i + 1} (${airdropAddress}) for deployer:`);
      console.log("- Token Address:", TOKEN_ADDRESS);
      console.log("- Airdrop Contract Address:", airdropAddress);
      console.log("- Claimer Address:", deployer.address);
      console.log("- Amount (raw):", ethers.utils.parseEther("1000").toString());
      console.log("- Merkle Proof:", JSON.stringify(deployerProof));
      console.log("---------------------------\n");
    }

    const finalBalance = await deployer.getBalance();
    console.log("\nScript completed.");
    console.log("Final ETH balance:", ethers.utils.formatEther(finalBalance), "ETH");
    console.log("Total ETH spent:", ethers.utils.formatEther(initialBalance.sub(finalBalance)), "ETH");

  } catch (error) {
    console.error("\n--- SCRIPT FAILED ---");
    console.error(error);
    const finalBalanceOnError = await (await ethers.getSigners())[0].getBalance();
    console.log("Final ETH balance on error:", ethers.utils.formatEther(finalBalanceOnError), "ETH");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("\n--- UNHANDLED EXCEPTION ---");
    console.error(error);
    process.exit(1);
  }); 