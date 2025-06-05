async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Attempting to create airdrop with account:", deployer.address);

  const factoryAddress = process.env.FACTORY_ADDRESS; // Ensure FACTORY_ADDRESS is in .env or passed
  const mockTokenAddress = "0x6AF6a2Eac07f4A257a368942450BFA35ABA60c07"; // From previous deployment

  if (!factoryAddress) {
    console.error("Error: FACTORY_ADDRESS not found in environment variables.");
    process.exit(1);
  }

  console.log(`Using GraphiteAirdropFactory at: ${factoryAddress}`);
  console.log(`Using MockToken at: ${mockTokenAddress}`);

  const AirdropFactory = await ethers.getContractFactory("GraphiteAirdropFactory");
  const factory = AirdropFactory.attach(factoryAddress);

  const latestBlock = await ethers.provider.getBlock("latest");
  const startTime = latestBlock.timestamp;
  const endTime = startTime + 86400; // 1 day later

  const merkleRoot = "0x0000000000000000000000000000000000000000000000000000000000000001";
  const requiredTrustScore = 100;
  const requiredKYCLevel = 0; // Set to 0 as KYC check is commented out in factory for creator
  const requiredAccountAge = 86400; // 1 day in seconds

  try {
    console.log("Attempting to call createAirdrop...");
    const tx = await factory.createAirdrop(
      mockTokenAddress,
      merkleRoot,
      requiredTrustScore,
      requiredKYCLevel,
      requiredAccountAge,
      startTime,
      endTime
    );
    console.log("createAirdrop transaction sent:", tx.hash);
    await tx.wait();
    console.log("Airdrop created successfully (THIS SHOULD NOT HAPPEN WITH 0 REPUTATION)");
  } catch (error) {
    console.error("Error during createAirdrop:", error.message);
    if (error.message.includes("InsufficientReputationScore")) {
      console.log("Successfully caught expected InsufficientReputationScore error.");
    } else {
      console.log("Caught an unexpected error.");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unhandled script error:", error);
    process.exit(1);
  }); 