// This file exports ABI definitions for smart contracts used in the application

// Trust Score Contract ABI
export const TrustScoreABI = [
  // Read functions
  {
    "inputs": [{"internalType": "address", "name": "userAddress", "type": "address"}],
    "name": "getScore",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "userAddress", "type": "address"}],
    "name": "getScoreHistory",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "score", "type": "uint256"},
          {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
          {"internalType": "string", "name": "reason", "type": "string"}
        ],
        "internalType": "struct TrustScore.ScoreUpdate[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Write functions
  {
    "inputs": [{"internalType": "address", "name": "userAddress", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}, {"internalType": "string", "name": "reason", "type": "string"}],
    "name": "updateScore",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Trust KYC Contract ABI
export const TrustKYCABI = [
  // Read functions
  {
    "inputs": [{"internalType": "address", "name": "userAddress", "type": "address"}],
    "name": "getVerificationStatus",
    "outputs": [
      {
        "components": [
          {"internalType": "uint8", "name": "level", "type": "uint8"},
          {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
          {"internalType": "bool", "name": "isVerified", "type": "bool"}
        ],
        "internalType": "struct TrustKYC.VerificationStatus",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Write functions
  {
    "inputs": [{"internalType": "uint8", "name": "level", "type": "uint8"}],
    "name": "initiateVerification",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "userAddress", "type": "address"}, {"internalType": "uint8", "name": "level", "type": "uint8"}, {"internalType": "bool", "name": "verified", "type": "bool"}],
    "name": "setVerificationStatus",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Trust Token Contract ABI
export const TrustTokenABI = [
  // Standard ERC-20 functions (partial)
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "recipient", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "transfer",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
]; 