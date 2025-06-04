import GraphiteReputationEcosystemABI from './abis/GraphiteReputationEcosystem.json';
import GraphiteTrustNFTABI from './abis/GraphiteTrustNFT.json';
import GraphiteTrustScoreAdapterABI from './abis/GraphiteTrustScoreAdapter.json';
import GraphiteAirdropFactoryABI from './abis/GraphiteAirdropFactory.json';
import SybilResistantAirdropABI from './abis/SybilResistantAirdrop.json';
import IGraphiteFeeABI from './abis/IGraphiteFee.json';
import IGraphiteKYCABI from './abis/IGraphiteKYC.json';
import IGraphiteReputationABI from './abis/IGraphiteReputation.json';

// Contract addresses - These should come from environment variables in production
export const CONTRACT_ADDRESSES = {
  // Main Graphite contracts
  reputationEcosystem: process.env.NEXT_PUBLIC_REPUTATION_ECOSYSTEM_CONTRACT || '0xDefaultEcosystemAddress',
  trustNFT: process.env.NEXT_PUBLIC_TRUST_NFT_CONTRACT || '0x4f0C27955880D3D5014eD90AC93871dc643d524F',
  trustScoreAdapter: process.env.NEXT_PUBLIC_TRUST_SCORE_ADAPTER_CONTRACT || '0xDefaultTrustScoreAdapterAddress',
  airdropFactory: process.env.NEXT_PUBLIC_AIRDROP_FACTORY_CONTRACT || '0xDefaultAirdropFactoryAddress',
  token: process.env.NEXT_PUBLIC_TOKEN_ADDRESS || '0xDefaultTokenAddress',
  
  // Native Graphite system contracts
  reputation: '0x0000000000000000000000000000000000001008',
  kyc: '0x0000000000000000000000000000000000001001',
  activation: '0x0000000000000000000000000000000000001000',
  fee: '0x0000000000000000000000000000000000001000',
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
  fee: IGraphiteFeeABI.abi,
  kyc: IGraphiteKYCABI.abi,
  reputation: IGraphiteReputationABI.abi,
};

// Contract type definitions for better TypeScript integration
export type ContractName = keyof typeof ABIS;
export type ContractAddressKey = Exclude<keyof typeof CONTRACT_ADDRESSES, 'supportedChains' | 'defaultChain'>;

// Helper functions for contract interaction
export const getContractConfig = (contractName: ContractName) => {
  const address = CONTRACT_ADDRESSES[contractName as ContractAddressKey] as `0x${string}`;
  const abi = ABIS[contractName];
  
  if (!address || !abi) {
    console.warn(`Contract configuration not found for ${contractName}. Address: ${address}, ABI present: ${!!abi}`);
  }

  return {
    address,
    abi,
  };
}; 