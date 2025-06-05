const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const { Buffer } = require('buffer'); // Ensures Buffer is available

// Recipients are passed as a JSON string argument
const recipientsArg = process.argv[2];
if (!recipientsArg) {
  console.error("Usage: node generate_merkle_data_temp.js '<json_array_of_recipients>'");
  process.exit(1);
}

let recipients;
try {
    recipients = JSON.parse(recipientsArg).map(r => ({
        address: r.address.toLowerCase(), // Ensure lowercase for consistency
        amount: BigInt(r.amount)
    }));
} catch (e) {
    console.error("Error parsing recipients JSON:", e.message);
    process.exit(1);
}


const leaves = recipients.map(r =>
    keccak256(Buffer.from(`${r.address}${r.amount.toString()}`))
);

const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
const root = tree.getHexRoot().startsWith('0x') ? tree.getHexRoot() : '0x' + tree.getHexRoot();

const proofs = {};
const leafLookup = {};

recipients.forEach((r, index) => {
    const leafBuffer = leaves[index];
    // Ensure proofs are '0x'-prefixed hex strings
    proofs[r.address] = tree.getHexProof(leafBuffer).map(p => p.startsWith('0x') ? p : '0x' + p);
    leafLookup[r.address] = leafBuffer.toString('hex').startsWith('0x') ? leafBuffer.toString('hex') : '0x' + leafBuffer.toString('hex');
});

// Prepare recipients for output (amounts as strings)
const outputRecipients = recipients.map(r => ({
    address: r.address,
    amount: r.amount.toString()
}));

console.log(JSON.stringify({
    root: root,
    proofs,
    recipients: outputRecipients,
    leafLookup
}, null, 2)); // Pretty print for easier debugging if needed
