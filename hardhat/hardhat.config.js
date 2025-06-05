require('@nomiclabs/hardhat-ethers');
require('dotenv').config();

module.exports = {
  solidity: {
    version: "0.8.13",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true,
    }
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
    cache: "./cache"
  },
  networks: {
    graphite: {
      url: "https://anon-entrypoint-1.atgraphite.com",
      accounts: [process.env.PRIVATE_KEY],
      // Force low gas price to stay under the fee cap
      gasPrice: 20000000000, // 20 gwei
      // Set a custom gas limit to avoid exceeding the fee cap
      gas: 3000000
    },
    graphite_testnet: {
      url: "https://anon-entrypoint-test-1.atgraphite.com",
      accounts: [process.env.PRIVATE_KEY],
      // Use higher gas price to avoid transaction underpriced error
      gasPrice: 300000000000, // 300 gwei
      // Set a custom gas limit to avoid exceeding the fee cap
      gas: 3000000,
      chainId: 54170
    },
  },
}; 