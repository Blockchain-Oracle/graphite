import GraphiteReputationEcosystemABI from './abis/GraphiteReputationEcosystem.json';
import GraphiteTrustNFTABI from './abis/GraphiteTrustNFT.json';
import GraphiteTrustScoreAdapterABI from './abis/GraphiteTrustScoreAdapter.json';
import GraphiteAirdropFactoryABI from './abis/GraphiteAirdropFactory.json';
import SybilResistantAirdropABI from './abis/SybilResistantAirdrop.json';

// Contract addresses - These should come from environment variables in production
export const CONTRACT_ADDRESSES = {
  // Main Graphite contracts
  reputationEcosystem: process.env.NEXT_PUBLIC_REPUTATION_ECOSYSTEM_CONTRACT || '0xReputationEcosystemAddress',
  trustNFT: process.env.NEXT_PUBLIC_TRUST_NFT_CONTRACT || '0xTrustNFTAddress',
  trustScoreAdapter: process.env.NEXT_PUBLIC_TRUST_SCORE_ADAPTER_CONTRACT || '0xTrustScoreAdapterAddress',
  airdropFactory: process.env.NEXT_PUBLIC_AIRDROP_FACTORY_CONTRACT || '0xAirdropFactoryAddress',
  
  // Native Graphite system contracts
  reputation: '0x0000000000000000000000000000000000001008',
  kyc: '0x0000000000000000000000000000000000001001',
  activation: '0x0000000000000000000000000000000000001000',
  filter: '0x0000000000000000000000000000000000001002',
  
  // Network configuration
  supportedChains: [54170, 440017], // Graphite Testnet, Graphite Mainnet
  defaultChain: 54170, // Graphite Testnet
};

// ABIs
export const ABIS = {
  reputationEcosystem: GraphiteReputationEcosystemABI.abi,
  trustNFT: GraphiteTrustNFTABI.abi,
  trustScoreAdapter: GraphiteTrustScoreAdapterABI.abi,
  airdropFactory: GraphiteAirdropFactoryABI.abi,
  sybilResistantAirdrop: SybilResistantAirdropABI.abi,
};

// Contract type definitions for better TypeScript integration
export type ContractName = keyof typeof ABIS;
export type ContractAddress = keyof typeof CONTRACT_ADDRESSES;

// Helper functions for contract interaction
export const getContractConfig = (contractName: ContractName) => {
  const address = CONTRACT_ADDRESSES[contractName as ContractAddress] as `0x${string}`;
  const abi = ABIS[contractName];
  
  return {
    address,
    abi,
  };
}; 