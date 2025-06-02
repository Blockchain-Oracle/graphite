// NFT Types
export interface NFT {
  id: string;
  tokenId: number;
  name: string;
  description: string;
  image: string; // Path to the tier badge SVG
  owner: string; // Wallet address
  trustScore: number;
  tier: NFTTier;
  createdAt: string;
  attributes: NFTAttribute[];
  customizations?: NFTCustomization;
}

export enum NFTTier {
  TIER_1 = 'TIER_1',
  TIER_2 = 'TIER_2',
  TIER_3 = 'TIER_3',
  TIER_4 = 'TIER_4',
  TIER_5 = 'TIER_5'
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

export interface NFTCustomization {
  baseModel: string; // Placeholder for future customization
  accessories: string[]; // Placeholder
  colors: { // Placeholder
    primary: string;
    secondary: string;
    accent: string;
  };
  animation: string; // Placeholder
}

// Mock data for prototyping
export const MOCK_NFTS: NFT[] = [
  {
    id: '1',
    tokenId: 1,
    name: 'Trust Guardian - Tier 1',
    description: 'Represents the foundational level of trust.',
    image: '/trust-badges/tier-1.svg',
    owner: '0x1234567890123456789012345678901234567890',
    trustScore: 150,
    tier: NFTTier.TIER_1,
    createdAt: new Date(2023, 5, 15).toISOString(),
    attributes: [
      { trait_type: 'Level', value: 1 },
      { trait_type: 'Verification', value: 'Basic' }
    ],
    customizations: { // Default placeholder customizations
      baseModel: 'standard',
      accessories: [],
      colors: { primary: '#60A5FA', secondary: '#FFFFFF', accent: '#A0A0A0' },
      animation: 'static'
    }
  },
  {
    id: '2',
    tokenId: 2,
    name: 'Trust Guardian - Tier 2',
    description: 'Indicates a growing level of established trust.',
    image: '/trust-badges/tier-2.svg',
    owner: '0x1234567890123456789012345678901234567890',
    trustScore: 350,
    tier: NFTTier.TIER_2,
    createdAt: new Date(2023, 6, 20).toISOString(),
    attributes: [
      { trait_type: 'Level', value: 2 },
      { trait_type: 'Verification', value: 'Intermediate' }
    ],
    customizations: {
      baseModel: 'standard',
      accessories: ['shield_icon'], // Example accessory
      colors: { primary: '#4ADE80', secondary: '#FFFFFF', accent: '#A0A0A0' },
      animation: 'static'
    }
  },
  {
    id: '3',
    tokenId: 3,
    name: 'Trust Guardian - Tier 3',
    description: 'Signifies a strong and reliable trust history.',
    image: '/trust-badges/tier-3.svg',
    owner: '0x0987654321098765432109876543210987654321',
    trustScore: 550,
    tier: NFTTier.TIER_3,
    createdAt: new Date(2023, 7, 10).toISOString(),
    attributes: [
      { trait_type: 'Level', value: 3 },
      { trait_type: 'Verification', value: 'Advanced' }
    ],
     customizations: {
      baseModel: 'advanced',
      accessories: ['shield_icon', 'aura_effect'],
      colors: { primary: '#C084FC', secondary: '#FFFFFF', accent: '#A0A0A0' },
      animation: 'float'
    }
  },
  {
    id: '4',
    tokenId: 4,
    name: 'Trust Guardian - Tier 4',
    description: 'Demonstrates a high degree of consistent trustworthiness.',
    image: '/trust-badges/tier-4.svg',
    owner: '0x1234567890123456789012345678901234567890',
    trustScore: 750,
    tier: NFTTier.TIER_4,
    createdAt: new Date(2023, 8, 5).toISOString(),
    attributes: [
      { trait_type: 'Level', value: 4 },
      { trait_type: 'Verification', value: 'Expert' }
    ],
    customizations: {
      baseModel: 'advanced',
      accessories: ['shield_icon', 'aura_effect', 'glowing_particles'],
      colors: { primary: '#FCD34D', secondary: '#FFFFFF', accent: '#A0A0A0' },
      animation: 'rotate'
    }
  },
  {
    id: '5',
    tokenId: 5,
    name: 'Trust Guardian - Tier 5',
    description: 'Represents the pinnacle of trust and reputation.',
    image: '/trust-badges/tier-5.svg',
    owner: '0x0987654321098765432109876543210987654321',
    trustScore: 950,
    tier: NFTTier.TIER_5,
    createdAt: new Date(2023, 9, 1).toISOString(),
    attributes: [
      { trait_type: 'Level', value: 5 },
      { trait_type: 'Verification', value: 'Master' }
    ],
    customizations: {
      baseModel: 'premium',
      accessories: ['shield_icon', 'aura_effect', 'glowing_particles', 'crown_icon'],
      colors: { primary: '#F472B6', secondary: '#FFFFFF', accent: '#A0A0A0' },
      animation: 'pulse'
    }
  }
];

// Helper functions
export function getTierFromTrustScore(score: number): NFTTier {
  if (score >= 800) return NFTTier.TIER_5;
  if (score >= 600) return NFTTier.TIER_4;
  if (score >= 400) return NFTTier.TIER_3;
  if (score >= 200) return NFTTier.TIER_2;
  return NFTTier.TIER_1;
}

export function getTierColor(tier: NFTTier): string {
  switch (tier) {
    case NFTTier.TIER_1: return '#60A5FA'; // Blue
    case NFTTier.TIER_2: return '#4ADE80'; // Green
    case NFTTier.TIER_3: return '#C084FC'; // Purple
    case NFTTier.TIER_4: return '#FCD34D'; // Yellow
    case NFTTier.TIER_5: return '#F472B6'; // Pink
    default: return '#A0A0A0'; // Default
  }
}

export function getUserEligibleTier(trustScore: number): NFTTier {
  return getTierFromTrustScore(trustScore);
}

// Customization options (placeholders, can be expanded)
export const CUSTOMIZATION_OPTIONS = {
  baseModels: ['standard', 'advanced', 'premium'],
  accessories: ['none', 'shield_icon', 'aura_effect', 'glowing_particles', 'crown_icon'],
  animations: ['static', 'float', 'rotate', 'pulse', 'dance']
}; 