async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying MockToken with the account:", deployer.address);

  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");

  const MockToken = await ethers.getContractFactory("MockToken");
  const initialSupply = ethers.utils.parseUnits("1000000", 18); // 1 Million tokens
  console.log("Deploying MockToken with initial supply of 1,000,000 MMT...");
  const mockToken = await MockToken.deploy("MyMockToken", "MMT", initialSupply);

  await mockToken.deployed();
  console.log("MockToken deployed to:", mockToken.address);
  console.log("Set this address as MOCK_TOKEN_ADDRESS in your environment or scripts.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 