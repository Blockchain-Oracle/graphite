# Graphite Ecosystem Frontend

A Next.js-based frontend for the Graphite Ecosystem, focusing on trust scores, KYC verification, and sybil-resistant identity in Web3.

## Overview

Graphite's primary differentiator is its reputation-centric approach, enabling trust-based interactions through:

- **Trust Scores**: Users earn trust scores (0-1000) based on KYC verification, account longevity, and on-chain activity
- **KYC Verification**: A simple but effective KYC process that allows users to build reputation without compromising personal privacy
- **Trust Tiers**: Five distinct tiers of trust with corresponding visual badges and ecosystem privileges

## Trust Badge System

The Graphite Trust Badge is a visual representation of a user's trust level in the ecosystem:

1. **Newcomer** (0-200): Basic access to the ecosystem
2. **Established** (201-400): Access to exclusive airdrops
3. **Trusted** (401-600): Priority access across integrated platforms
4. **Influencer** (601-800): Ability to vouch for others in the network
5. **Authority** (801-1000): Governance rights within the ecosystem

## Features

- **Modern UI** built with Next.js, React, and TailwindCSS
- **Web3 Integration** using wagmi and RainbowKit for wallet connections
- **Trust-based identity system** with visual tier progression
- **KYC verification flow** for establishing trust
- **Trust Globe** visualization showing network effects

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

## Environment Variables

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_WALLET_CONNECT_ID=your_wallet_connect_id
```

## Tech Stack

- **Framework**: Next.js 15
- **UI**: React 19, TailwindCSS, shadcn/ui
- **Web3**: wagmi, RainbowKit
- **Animations**: Framer Motion
- **Deployment**: Vercel

## Architecture

The project follows a clean architecture with:

- `/components`: UI components
  - `/landing`: Landing page sections
  - `/ui`: Shadcn UI components
  - `/web3`: Web3-specific components
  - `/magicui`: Visual effects and animations
- `/lib`: Utility functions and helpers
- `/public`: Static assets including trust badges

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
