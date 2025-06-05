const { ethers, network } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Using account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());
    console.log(`Running on network: ${network.name}`);

    const numberOfRuns = 5;
    for (let i = 0; i < numberOfRuns; i++) {
        console.log(`\n\n--- Starting Run ${i + 1} of ${numberOfRuns} ---`);

        // 1. Deploy a new ERC20 token
        const randomSuffix = Math.random().toString(36).substring(2, 7); // Shorter suffix for multiple runs
        const tokenName = `GraphiteTestToken${randomSuffix}${i + 1}`;
        const tokenSymbol = `GTT${randomSuffix.toUpperCase()}`;
        const initialSupply = ethers.utils.parseUnits("10000000", 18);

        console.log(`Deploying ${tokenName} (${tokenSymbol}) with initial supply of ${ethers.utils.formatEther(initialSupply)}...`);
        const MockTokenFactory = await ethers.getContractFactory("MockToken");
        const mockToken = await MockTokenFactory.deploy(tokenName, tokenSymbol, initialSupply);
        await mockToken.deployed();
        console.log(`${tokenName} deployed to:`, mockToken.address);
        console.log(`Deployer's ${tokenSymbol} balance:`, ethers.utils.formatEther(await mockToken.balanceOf(deployer.address)));

        // 2. Prepare Merkle Tree data for the airdrop
        const airdropRecipientAddresses = [
            "0xC6969eC3C5dFE5A8eCe77ECee940BC52883602E6",
            "0x1CbA2Ec4e28870eEa266DABc1C21838d9671EEac",
        ];
        const amountPerRecipient = ethers.utils.parseUnits("100", 18);

        console.log(`Generating Merkle tree for ${airdropRecipientAddresses.length} recipients, each receiving ${ethers.utils.formatEther(amountPerRecipient)} ${tokenSymbol} (details follow).`);

        const leaves = airdropRecipientAddresses.map(addr =>
            ethers.utils.solidityKeccak256(["address", "uint256"], [addr, amountPerRecipient])
        );
        const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
        const merkleRoot = merkleTree.getHexRoot();
        console.log("Merkle Root:", merkleRoot);

        airdropRecipientAddresses.forEach((addr, index) => {
            const leaf = leaves[index];
            const proof = merkleTree.getHexProof(leaf);
            console.log(`  Recipient: ${addr}`);
            console.log(`  Amount: ${ethers.utils.formatEther(amountPerRecipient)} ${tokenSymbol}`);
            console.log(`  Leaf: ${leaf}`);
            console.log(`  Proof: [${proof.join(", ")}]`);
            const isValid = merkleTree.verify(proof, leaf, merkleRoot);
            console.log(`  Proof verification: ${isValid}`);
            if (!isValid) {
                console.error(`Merkle proof verification failed for ${addr}. Halting.`);
                process.exit(1);
            }
        });

        // 3. Deploy GraphiteAirdropFactory
        const graphiteReputationEcosystemAddress = deployer.address;
        const graphiteTrustNFTAddress = deployer.address;
        const feeCollectorAddress = deployer.address;
        const creationFee = ethers.utils.parseEther("0.001");

        console.log("\nDeploying GraphiteAirdropFactory...");
        console.log(`  Reputation Ecosystem: ${graphiteReputationEcosystemAddress}`);
        console.log(`  Trust NFT: ${graphiteTrustNFTAddress}`);
        console.log(`  Fee Collector: ${feeCollectorAddress}`);
        console.log(`  Creation Fee: ${ethers.utils.formatEther(creationFee)} ETH`);

        const AirdropFactory = await ethers.getContractFactory("GraphiteAirdropFactory");
        const airdropFactory = await AirdropFactory.deploy(
            graphiteReputationEcosystemAddress,
            graphiteTrustNFTAddress,
            feeCollectorAddress,
            creationFee
        );
        await airdropFactory.deployed();
        console.log("GraphiteAirdropFactory deployed to:", airdropFactory.address);

        // 4. Create an airdrop using the factory
        const airdropName = `TestAirdrop_${tokenSymbol}`;
        const airdropDescription = `This is a test airdrop for the ${tokenName} token, created by script.`;
        const nowInSeconds = Math.floor(Date.now() / 1000);
        const airdropStartTime = nowInSeconds + 60;
        const airdropEndTime = airdropStartTime + (7 * 24 * 60 * 60);
        const minReputation = 0;
        const minTier = 0;

        console.log(`\nCreating airdrop "${airdropName}" via factory...`);
        console.log(`  Token: ${mockToken.address}`);
        console.log(`  Merkle Root: ${merkleRoot}`);
        console.log(`  Start Time: ${new Date(airdropStartTime * 1000).toISOString()}`);
        console.log(`  End Time: ${new Date(airdropEndTime * 1000).toISOString()}`);

        const createAirdropTx = await airdropFactory.createAirdrop(
            mockToken.address,
            merkleRoot,
            airdropName,
            airdropDescription,
            airdropStartTime,
            airdropEndTime,
            minReputation,
            minTier,
            { value: creationFee }
        );
        console.log("Airdrop creation transaction sent:", createAirdropTx.hash);
        const createAirdropReceipt = await createAirdropTx.wait();
        console.log("Airdrop creation transaction confirmed.");

        let newAirdropAddress = "";
        if (createAirdropReceipt.events) {
            for (const event of createAirdropReceipt.events) {
                if (event.event === "AirdropCreated" && event.args) {
                    newAirdropAddress = event.args.airdropContract;
                    console.log(`Successfully parsed AirdropCreated event. New Airdrop contract at: ${newAirdropAddress}`);
                    break;
                }
            }
        }

        if (!newAirdropAddress) {
            console.warn("Could not find AirdropCreated event in transaction receipt. Attempting fallback...");
            const createdAirdrops = await airdropFactory.getAirdropsByCreator(deployer.address);
            if (createdAirdrops.length > 0) {
                newAirdropAddress = createdAirdrops[createdAirdrops.length - 1];
                console.log(`Found airdrop address via getAirdropsByCreator (last one): ${newAirdropAddress}`);
            } else {
                console.error("Failed to retrieve newAirdropAddress. TX hash:", createAirdropTx.hash);
                process.exit(1);
            }
        }

        console.log(`SybilResistantAirdrop for "${airdropName}" is at: ${newAirdropAddress}`);

        // 5. Approve the airdrop contract to spend tokens
        const totalAirdropAmount = amountPerRecipient.mul(airdropRecipientAddresses.length);
        console.log(`Approving airdrop (${newAirdropAddress}) for ${ethers.utils.formatEther(totalAirdropAmount)} ${tokenSymbol}...`);

        const currentAllowance = await mockToken.allowance(deployer.address, newAirdropAddress);
        console.log(`Current allowance: ${ethers.utils.formatEther(currentAllowance)} ${tokenSymbol}`);

        if (currentAllowance.lt(totalAirdropAmount)) {
            const approveTx = await mockToken.connect(deployer).approve(newAirdropAddress, totalAirdropAmount);
            console.log("Approval transaction sent:", approveTx.hash);
            await approveTx.wait();
            console.log("Approval successful.");
            const newAllowance = await mockToken.allowance(deployer.address, newAirdropAddress);
            console.log(`New allowance: ${ethers.utils.formatEther(newAllowance)} ${tokenSymbol}`);
        } else {
            console.log("Sufficient allowance already exists.");
        }

        console.log(`\nAirdrop setup for "${airdropName}" complete.`);
        console.log(`  Token: ${mockToken.address}`);
        console.log(`  Airdrop Contract: ${newAirdropAddress}`);
        console.log(`  Merkle Root: ${merkleRoot}`);
        console.log(`  Recipients claim: ${ethers.utils.formatEther(amountPerRecipient)} ${tokenSymbol} each.`);
        console.log(`  Deployer approved: ${ethers.utils.formatEther(totalAirdropAmount)} ${tokenSymbol}.`);
        console.log("\nRun finished successfully! ✅");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Script failed: ❌");
        console.error(error);
        process.exit(1);
    }); 