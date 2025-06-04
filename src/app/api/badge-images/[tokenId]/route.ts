import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createPublicClient, http } from 'viem';
// import { mainnet } from 'viem/chains'; // No longer using mainnet directly
import { CONTRACT_ADDRESSES, ABIS } from '@/lib/web3/contract-config';
import { Chain } from 'wagmi/chains'; // Import Chain type

// Define Graphite Testnet (copied from rainbow-kit-provider for self-containment, consider centralizing)
const graphiteTestnet = {
  id: 54170,
  name: 'Graphite Testnet',
  nativeCurrency: {
    name: 'Graphite',
    symbol: '@G',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://anon-entrypoint-test-1.atgraphite.com'],
    },
    public: {
      http: ['https://anon-entrypoint-test-1.atgraphite.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Graphite Explorer',
      url: 'https://test.atgraphite.com',
    },
  },
  testnet: true,
} as const satisfies Chain;

// Initialize Viem Public Client for Graphite Testnet
const publicClient = createPublicClient({
  chain: graphiteTestnet,
  transport: http(graphiteTestnet.rpcUrls.default.http[0]),
});

// Tier mapping based on trust score
function getTierLevel(trustScore: number): number {
  if (trustScore >= 800) return 5;
  if (trustScore >= 600) return 4;
  if (trustScore >= 400) return 3;
  if (trustScore >= 200) return 2;
  return 1;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  const { tokenId } = params;

  if (!tokenId || isNaN(parseInt(tokenId))) {
    return new NextResponse(JSON.stringify({ error: 'Invalid or missing tokenId' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  let trustScore: number;

  try {
    const score = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.trustNFT as `0x${string}`,
      abi: ABIS.trustNFT,
      functionName: 'lastTrustScore',
      args: [BigInt(tokenId)],
    });
    console.log('score', score);
    trustScore = Number(score) * 650 / 1000;
    console.log('trustScore', trustScore);
  } catch (contractError: any) {
    console.error(`Error fetching trust score for tokenId ${tokenId}:`, contractError);
    // Return a generic badge or an error image if score cannot be fetched
    // For now, defaulting to tier 1 if score fetch fails, or you can return an error SVG
    trustScore = 0; // Default to lowest tier on error
    // Alternatively, return an error response:
    // const errorSvg = `<svg>...</svg>`; // Define an error SVG
    // return new NextResponse(errorSvg, { headers: { 'Content-Type': 'image/svg+xml' }, status: 500 });
  }
  
  // Determine tier level based on trust score
  const tierLevel = getTierLevel(trustScore);
  
  try {
    const filePath = path.join(process.cwd(), 'public', 'trust-badges', `tier-${tierLevel}.svg`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Badge file not found: tier-${tierLevel}.svg`);
    }
    const imageBuffer = fs.readFileSync(filePath);
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });
  } catch (error) {
    console.error(`Error serving badge image for tokenId ${tokenId}, tier ${tierLevel}:`, error);
    
    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#ccc" /><text x="50" y="55" font-family="Arial" font-size="12" text-anchor="middle" fill="white">Error</text></svg>`;
    
    return new NextResponse(fallbackSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Access-Control-Allow-Origin': '*'
      },
      status: 500
    });
  }
} 