# Graphite: Web3 Reputation & Trust Ecosystem

<div align="center">
  <img src="https://raw.githubusercontent.com/Blockchain-Oracle/graphite/main/public/trust-badges/tier-5.svg" alt="Graphite Logo" width="150" />
  <h3>Building Trust in Web3, One Score at a Time</h3>
  
  [![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Web3](https://img.shields.io/badge/Web3-Enabled-brightgreen?style=for-the-badge&logo=ethereum)](https://ethereum.org/)
</div>

## 🌐 Live Demo

- **Main Demo**: [https://graphite-rouge.vercel.app/](https://graphite-rouge.vercel.app/)
- **Testnet Explorer**: [https://test.atgraphite.com/](https://test.atgraphite.com/)

## 🔗 Contract Addresses (Sepolia Testnet)

All smart contracts are deployed on the Ethereum Sepolia testnet. You can view contract transactions and interactions using the [Graphite Testnet Explorer](https://test.atgraphite.com/).

| Contract | Address | View on Explorer |
|---------|---------|-----------------|
| **Token** | `0x306000D966A28CA768E2a3b84b63a7BCf4Cca58A` | [View](https://test.atgraphite.com/address/0x306000D966A28CA768E2a3b84b63a7BCf4Cca58A) |
| **Reputation Ecosystem** | `0xda468E6409F715d61c44DD53A75e58ea5265eA50` | [View](https://test.atgraphite.com/address/0xda468E6409F715d61c44DD53A75e58ea5265eA50) |
| **Trust NFT** | `0x4f0C27955880D3D5014eD90AC93871dc643d524F` | [View](https://test.atgraphite.com/address/0x4f0C27955880D3D5014eD90AC93871dc643d524F) |
| **Trust Score Adapter** | `0x98AD158893AE8d0f73fbfDB1E6dA616D5fB1Fb19` | [View](https://test.atgraphite.com/address/0x98AD158893AE8d0f73fbfDB1E6dA616D5fB1Fb19) |
| **Airdrop Factory** | `0xcbcccE385aD801376B31d6038eee3D3A7E8F7351` | [View](https://test.atgraphite.com/address/0xcbcccE385aD801376B31d6038eee3D3A7E8F7351) |
| **Vote Factory** | `0x9464cD055caEC197d06Fc119Bb4a9a6E94596697` | [View](https://test.atgraphite.com/address/0x9464cD055caEC197d06Fc119Bb4a9a6E94596697) |

Example user address to explore: [0x7d71f82611ba86bc302a655ec3d2050e98baf49c](https://test.atgraphite.com/address/0x7d71f82611ba86bc302a655ec3d2050e98baf49c)

## 📝 Overview

Graphite is a next-generation reputation ecosystem for Web3, solving the crucial trust and identity challenges that plague decentralized applications. By providing a comprehensive reputation framework, Graphite enables:

- **Sybil-resistant interactions** through a multi-layered trust verification system
- **Trust-based airdrops** that reward genuine community members
- **Visual representation of trust** through NFT badges that evolve with user reputation
- **KYC verification** without compromising on privacy or decentralization principles
- **Cross-platform reputation** that persists across the Web3 ecosystem

## 🔑 Key Features

### Trust Score System

Graphite's core is the Trust Score—a numerical value between 0-1000 that represents a user's trustworthiness:

| Tier | Score Range | Badge | Features |
|------|-------------|-------|----------|
| **Authority** | 801-1000 | <img src="https://raw.githubusercontent.com/Blockchain-Oracle/graphite/main/public/trust-badges/tier-5.svg" alt="Authority" width="30" /> | Full governance rights, platform endorsement abilities |
| **Influencer** | 601-800 | <img src="https://raw.githubusercontent.com/Blockchain-Oracle/graphite/main/public/trust-badges/tier-4.svg" alt="Influencer" width="30" /> | Ability to vouch for others, high-value airdrop access |
| **Trusted** | 401-600 | <img src="https://raw.githubusercontent.com/Blockchain-Oracle/graphite/main/public/trust-badges/tier-3.svg" alt="Trusted" width="30" /> | Priority access across integrated platforms |
| **Established** | 201-400 | <img src="https://raw.githubusercontent.com/Blockchain-Oracle/graphite/main/public/trust-badges/tier-2.svg" alt="Established" width="30" /> | Access to exclusive airdrops |
| **Newcomer** | 0-200 | <img src="https://raw.githubusercontent.com/Blockchain-Oracle/graphite/main/public/trust-badges/tier-1.svg" alt="Newcomer" width="30" /> | Basic ecosystem access |

### Sybil-Resistant Airdrops

Create token distributions that reward genuine community members based on trust scores:

- **Merkle-proof verification** for gas-efficient claiming
- **Trust score thresholds** to ensure quality recipients
- **KYC-level requirements** for regulatory compliance where needed
- **Custom eligibility criteria** for targeted distribution

### Trust NFTs

Dynamic badges that represent a user's standing in the ecosystem:

- **Visual evolution** as trust scores increase
- **On-chain verification** of user's reputation
- **Customizable appearance** for personal expression
- **3D visualization** using React Three Fiber

### KYC and Reputation

Simple but effective verification mechanisms:

- **Progressive KYC levels** with increasing benefits
- **Reputation scoring** based on on-chain activity
- **Cross-platform integration** with Web3 identity solutions

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PNPM package manager
- MetaMask or another Web3 wallet

### Installation

```bash
# Clone the repository
git clone https://github.com/Blockchain-Oracle/graphite.git
cd graphite-frontend

# Install dependencies
pnpm install

# Set up environment variables (see below)
cp .env.example .env.local
# Edit .env.local with your values

# Run the development server
pnpm dev
```

### Environment Setup

Create a `.env.local` file based on the example:

```
# Frontend Base URL for metadata & image generation
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Contract Addresses (Testnet)
NEXT_PUBLIC_TOKEN_ADDRESS=0x306000D966A28CA768E2a3b84b63a7BCf4Cca58A
NEXT_PUBLIC_REPUTATION_ECOSYSTEM_CONTRACT=0xda468E6409F715d61c44DD53A75e58ea5265eA50
NEXT_PUBLIC_TRUST_NFT_CONTRACT=0x4f0C27955880D3D5014eD90AC93871dc643d524F
NEXT_PUBLIC_TRUST_SCORE_ADAPTER_CONTRACT=0x98AD158893AE8d0f73fbfDB1E6dA616D5fB1Fb19
NEXT_PUBLIC_AIRDROP_FACTORY_CONTRACT=0xcbcccE385aD801376B31d6038eee3D3A7E8F7351
NEXT_VOTE_FACTORY_ADDRESS=0x9464cD055caEC197d06Fc119Bb4a9a6E94596697

# Optional: WalletConnect ID (for production)
NEXT_PUBLIC_WALLET_CONNECT_ID=your_wallet_connect_id
```

## 🏗️ Architecture

### Frontend Structure

```
graphite-frontend/
├── public/                  # Static assets
│   └── trust-badges/       # SVG badges for each trust tier
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── airdrops/       # Airdrop-related pages
│   │   ├── dashboard/      # User dashboard
│   │   ├── nfts/           # Trust NFT pages
│   │   └── profile/        # User profile
│   ├── components/         # UI components
│   │   ├── landing/        # Landing page sections
│   │   ├── magicui/        # Animation and visual effects
│   │   ├── ui/             # shadcn/ui components
│   │   └── web3/           # Blockchain integration components
│   └── lib/                # Utility functions & hooks
│       ├── hooks/          # React hooks
│       └── web3/           # Web3 integration
│           └── abis/       # Contract ABIs
└── .env                    # Environment variables
```

### Smart Contract Integration

The frontend interacts with the following key smart contracts:

1. **GraphiteReputationEcosystem**: Core contract that manages the ecosystem
   - Controls Trust NFT minting
   - Verifies user reputation scores
   - Handles account activation

2. **SybilResistantAirdrop**: Ensures airdrop recipients are legitimate
   - Merkle tree verification
   - Trust score checking
   - KYC level validation

3. **GraphiteTrustNFT**: The NFT representing trust badges
   - Evolves based on trust score
   - Provides visual representation of reputation
   - Includes metadata for badge properties

4. **GraphiteAirdropFactory**: Creates new airdrops
   - Factory pattern for deploying sybil-resistant airdrops
   - Manages creator permissions
   - Handles token transfers for airdrops

## 🔄 Core Workflows

### Minting a Trust Badge

1. User connects wallet via RainbowKit
2. Navigates to `/nfts/mint`
3. Pays a small fee to mint their badge
4. Trust NFT is minted, reflecting their current trust score

### Creating an Airdrop

1. User navigates to `/airdrops/create`
2. Uploads CSV with recipient addresses and amounts
3. Sets required trust score and KYC level
4. Configures airdrop timing and token details
5. Approves token transfer and deploys the airdrop

### Claiming an Airdrop

1. User views available airdrops at `/airdrops/explore`
2. Eligible airdrops are highlighted based on user's trust score
3. User clicks "Claim" on an eligible airdrop
4. Contract verifies eligibility with Merkle proof and trust requirements
5. Tokens are transferred to the user's wallet

## 📱 Features Showcase

### Trust NFT Gallery

The `/nfts/gallery` route displays all minted trust badges, with real-time updates as scores change.

### Trust Score Dashboard

Users can monitor their reputation evolution at `/dashboard`, including:
- Current trust score and tier
- History of score changes
- Recommendations to improve their score
- Active airdrops they're eligible for

### Airdrop Explorer

The full-featured airdrop discovery tool at `/airdrops/explore` allows filtering by:
- Status (active, upcoming, completed)
- Eligibility based on user's trust score
- Token type (ERC20, ERC721)

## 🧪 Testing

```bash
# Run Jest tests
pnpm test

# Run Cypress E2E tests
pnpm test:e2e
```

## 🔮 Roadmap

- [ ] Mobile app integration
- [ ] Multi-chain support (Arbitrum, Optimism, Base)
- [ ] Enhanced 3D visualizations for Trust NFTs
- [ ] Integration with additional DeFi platforms
- [ ] DAO governance for trust parameter tuning

## 🛠️ Built With

- [Next.js](https://nextjs.org/) - React framework
- [React](https://reactjs.org/) - UI library
- [TailwindCSS](https://tailwindcss.com/) - CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [wagmi](https://wagmi.sh/) - React hooks for Ethereum
- [RainbowKit](https://www.rainbowkit.com/) - Wallet connection
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/) - 3D rendering
- [Framer Motion](https://www.framer.com/motion/) - Animations

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Ethereum Foundation](https://ethereum.org/) for Web3 standards
- [The OpenZeppelin team](https://openzeppelin.com/) for smart contract libraries
- [Blockchain Oracle](https://github.com/Blockchain-Oracle) for project coordination

## 💬 Contact

For questions or support, please open an issue on the [GitHub repository](https://github.com/Blockchain-Oracle/graphite/issues).
