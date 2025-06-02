
# Graphite Ecosystem: Page Structure & Routes Design

Based on our previous discussions about the Graphite ecosystem, here's a comprehensive page structure with routes and content recommendations. While I don't see the reference images you mentioned, I'll design a structure that would work well with modern web3 interfaces using the tech stack you specified.

## 1. Main Routes Structure

```
/                           # Landing/Home Page
├── dashboard               # User Dashboard
├── airdrops/               # Airdrop Explorer
│   ├── explore             # Browse all airdrops
│   ├── create              # Create new airdrop
│   ├── manage              # Manage created airdrops
│   └── [address]           # Individual airdrop page
├── nfts/                   # NFT System
│   ├── gallery             # User's NFT collection
│   ├── mint                # Mint new NFT
│   ├── customize/[tokenId] # Customize specific NFT
│   └── view/[tokenId]      # View specific NFT
└── profile                 # User Profile & Settings
```

## 2. Page Descriptions

### Landing Page (`/`)
- **Hero Section**: Gradient-animated background with 3D rotating trust score visualization
- **Features Overview**: Cards highlighting Airdrops and NFT systems
- **Trust Score Explanation**: Visual representation of the 5 tiers
- **Recent Airdrops**: Scrolling horizontal list of newest airdrops
- **Top NFTs**: Featured NFTs with 3D previews and hover effects
- **Connect Wallet Button**: Prominent CTA using Rainbow Kit

### Dashboard (`/dashboard`)
- **Trust Score Card**: Circular progress meter showing score (0-1000)
- **Tier Information**: Current tier with unlocked benefits and next tier preview
- **Quick Stats**: NFTs owned, airdrops eligible for, airdrops created
- **Recent Activity**: Timeline of recent transactions
- **Action Cards**: Create Airdrop, Mint NFT, Claim Eligible Airdrops

### Airdrop Explorer (`/airdrops/explore`)
- **Search & Filter Bar**: Filter by token, eligibility, active status
- **Grid/List Toggle**: Different view options for airdrops
- **Airdrop Cards**:
  - Token icon & name
  - Creator address
  - Eligibility indicators (trust score, KYC, etc.)
  - Claim button if eligible
  - Time remaining indicator

### Create Airdrop (`/airdrops/create`)
- **Multi-step Wizard**:
  1. Token Selection (ERC20 address input, token info display)
  2. Distribution List (CSV upload, preview table)
  3. Eligibility Settings (trust score slider, KYC options)
  4. Timing Settings (date pickers, duration)
  5. Review & Deploy (summary, gas estimate)
- **Progress Indicator**: Top of page showing all steps
- **Preview Panel**: Right side showing airdrop preview

### Manage Airdrops (`/airdrops/manage`)
- **Created Airdrops List**: Table of user's created airdrops
- **Filters**: Status filters (active, pending, ended)
- **Action Buttons**: Edit, Pause, Withdraw for each airdrop
- **Stats Overview**: Cards showing aggregated stats

### Individual Airdrop (`/airdrops/[address]`)
- **Hero Banner**: Token info, distribution details
- **Eligibility Section**: User's eligibility status with detailed breakdown
- **Claim Interface**: Generate proof and claim buttons
- **Distribution Stats**: Progress bar, claim rate, unique claimers
- **About Section**: Airdrop description, requirements, links

### NFT Gallery (`/nfts/gallery`)
- **3D Gallery View**: Interactive display of owned NFTs
- **Grid Alternative**: Toggle for traditional grid view
- **Filtering Options**: By tier, creation date, etc.
- **NFT Preview Cards**: 3D thumbnail with hover effects
- **Quick Actions**: View, Customize, Refresh Trust Score

### Mint NFT (`/nfts/mint`)
- **Eligibility Check**: Trust score verification
- **Base Model Selection**: Carousel of available 3D models
- **Preview Panel**: Real-time 3D preview with rotating view
- **Cost Information**: Mint cost and gas estimate
- **Mint Button**: Prominent CTA with transaction steps

### Customize NFT (`/nfts/customize/[tokenId]`)
- **3D Preview**: Large interactive model preview
- **Customization Tabs**:
  - Base Models: Scrollable row of options
  - Accessories: Grid of items with tier locks
  - Color Palettes: Color swatches with tier locks
  - Animations: Animation previews with tier locks
- **Real-time Updates**: Model updates as options are selected
- **Save Button**: Submits changes to blockchain

### View NFT (`/nfts/view/[tokenId]`)
- **Full-screen 3D Viewer**: Interactive model with effects based on tier
- **Metadata Panel**: Trust score, tier, attributes
- **Owner Information**: Address, ownership history
- **Customization History**: Timeline of changes
- **Share Options**: Social sharing capabilities

### Profile (`/profile`)
- **Account Overview**: Wallet address, ENS name
- **Trust Score History**: Graph showing score evolution
- **KYC Status**: Verification level and upgrade options
- **Settings**: Theme preferences, notification settings
- **Transaction History**: List of past interactions

## 3. UI/UX Design Elements

### Layout Components
- **Navigation**: Side navigation with animated transitions
- **Header**: Minimal with wallet connection and network status
- **Footer**: Links, resources, and social media
- **Mobile Menu**: Animated drawer for responsive design

### Visual Elements
- **Glass Morphism Cards**: For NFTs and airdrop listings
- **Gradient Backgrounds**: Tier-based color schemes
- **Animated Transitions**: Between routes and states
- **3D Elements**: For NFT previews and trust score visualization
- **Skeleton Loaders**: For async data loading states

### Interactive Features
- **Drag and Drop**: For CSV uploads and NFT customization
- **Hover Effects**: On cards and buttons using Magic UI
- **Scroll-triggered Animations**: For section reveals
- **Toast Notifications**: For transaction updates

### Tier-Based Theming
Implement visual identity for each trust tier:
- **Beginner**: Subtle gray gradients, minimal effects
- **Novice**: Blue accents, light glow effects
- **Trusted**: Green highlights, particle animations
- **Established**: Purple theme, advanced animations
- **Elite**: Gold accents, premium effects and backgrounds
