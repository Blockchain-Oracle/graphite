# Graphite Ecosystem: Complete Technology Stack Documentation

## Core Technology Stack

### Frontend Framework
- **Next.js** - React framework with built-in routing and server components
- **TypeScript** - For type safety across the application

### UI Components & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Unstyled, accessible component library
- **Magic UI** - Enhanced UI components with advanced animations
- **Aceternity UI** - Premium animations for Tailwind

### Web3 Integration
- **wagmi** - React hooks for Ethereum data fetching and state management
- **viem** - Low-level Ethereum interface library
- **Rainbow Kit** - Wallet connection UI components
- **ethers.js** - (Alternative option) For more complex contract interactions

### 3D Visualization
- **Three.js** - Core 3D rendering library
- **React Three Fiber** - React renderer for Three.js
- **@react-three/drei** - Helper components for React Three Fiber

## Additional Recommended Tools

### State Management & Data Fetching
- **TanStack Query** - For managing asynchronous data from contracts
- **Zustand** - Lightweight state management with first-class TypeScript support

### Form Handling
- **React Hook Form** - Form state management and validation
- **Zod** - Schema validation library (pairs well with React Hook Form)

### Avatar Integration
- **Ready Player Me SDK** - For 3D avatar creation and customization
- **@readyplayerme/react-avatar-creator** - React wrapper for RPM

### Blockchain Tools
- **merkletreejs** - For generating Merkle trees for airdrops
- **keccak256** - For hashing functions in Merkle tree generation
- **@coinbase/wallet-sdk** - For additional wallet support

## Project Structure

```
graphite-app/
├── app/                        # Next.js app router
│   ├── dashboard/              # Dashboard routes
│   ├── airdrops/               # Airdrop routes
│   │   ├── explore/            # Browse airdrops
│   │   ├── create/             # Create airdrop
│   │   ├── manage/             # Manage airdrops
│   │   └── [address]/          # Single airdrop page
│   ├── nfts/                   # NFT routes
│   │   ├── gallery/            # NFT gallery
│   │   ├── mint/               # Mint NFT
│   │   ├── customize/[id]/     # Customize NFT
│   │   └── view/[id]/          # View NFT
│   └── profile/                # User profile
├── components/                 # Shared components
│   ├── ui/                     # Base UI components
│   ├── web3/                   # Web3 specific components
│   ├── nft/                    # NFT components
│   └── airdrop/                # Airdrop components
├── lib/                        # Utility functions
│   ├── contracts/              # Contract ABIs and hooks
│   ├── merkle/                 # Merkle tree generation
│   └── readyPlayerMe/          # RPM integration
├── hooks/                      # Custom React hooks
├── models/                     # 3D models and assets
└── public/                     # Static assets
```

## Technology Integration Guidelines

### Web3 Provider Setup

**Key Requirements:**
- Configure Rainbow Kit with the Graphite network
- Set up WagmiConfig with proper chain configurations
- Create a providers wrapper component for the application
- Include wallet connection handling with proper error states
- Support for multiple wallet providers through Rainbow Kit

### 3D Avatar Integration

**Key Requirements:**
- Create a reusable Avatar Viewer component using React Three Fiber
- Implement dynamic loading of Ready Player Me GLB models
- Apply visual effects based on the user's trust tier level
- Support different camera configurations and environments
- Implement proper error handling for failed model loading
- Consider performance optimizations for mobile devices

### Airdrop Factory Integration

**Key Requirements:**
- Create custom hooks for interacting with the AirdropFactory contract
- Implement functions for:
  - Retrieving all available airdrops
  - Creating new airdrops with customizable parameters
  - Tracking transaction status during airdrop creation
  - Filtering airdrops by creator or eligibility
- Handle proper error states during contract interaction
- Implement loading states for asynchronous operations

## Advanced Features & Integration Guidelines

### Merkle Tree Generation for Airdrops

**Key Requirements:**
- Create utility functions for generating Merkle trees from distribution lists
- Support various input formats for distribution data
- Generate Merkle root for smart contract deployment
- Create and store proofs for each recipient address
- Implement verification functions to validate proofs
- Consider client-side vs server-side generation based on data size

### Trust Score Visualization

**Key Requirements:**
- Create components to visualize user's trust score
- Implement visual indicators for different tier levels
- Support animated transitions between score changes
- Design appropriate UI for each trust tier with distinct visual language:
  - Beginner tier visual style (basic)
  - Novice tier visual style (improved)
  - Trusted tier visual style (enhanced)
  - Established tier visual style (premium)
  - Elite tier visual style (exclusive)
- Ensure accessibility in color choices and animations

## Development Tools & Workflow

### Recommended Development Setup

1. **Package Manager**: pnpm (as specified in your requirements)
2. **Version Control**: Git with Conventional Commits for clean history
3. **Linting**: ESLint with tailwind and React plugins
4. **Formatting**: Prettier
5. **Testing**: Vitest for unit tests, Cypress for E2E tests

### CI/CD Pipeline

For a production-grade application, consider implementing:

1. **GitHub Actions** for automated testing and deployment
2. **Vercel/Netlify** for frontend hosting and preview deployments
3. **Tenderly** for smart contract monitoring and alerting

## Additional Libraries to Consider

### Data Visualization
- **recharts** - For creating charts to visualize airdrop distributions
- **d3.js** - For advanced data visualizations

### Animations & Effects
- **framer-motion** - For UI animations and transitions
- **gsap** - For advanced animations
- **leva** - Debug UI for Three.js scenes

### Web3 Analytics
- **Dune Analytics** - For creating dashboards to track airdrop metrics
- **The Graph** - For indexing blockchain events (if needed)

This technology stack provides a complete foundation for building the Graphite Ecosystem, including both the Airdrop Factory and Trust NFT systems, with modern web3 and 3D visualization capabilities.
