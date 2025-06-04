import { NextRequest, NextResponse } from 'next/server';

// Tier mapping based on trust score
function getTierInfo(trustScore: number): { name: string; level: number } {
  if (trustScore >= 800) return { name: 'Authority', level: 5 };
  if (trustScore >= 600) return { name: 'Influencer', level: 4 };
  if (trustScore >= 400) return { name: 'Trusted', level: 3 };
  if (trustScore >= 200) return { name: 'Established', level: 2 };
  return { name: 'Newcomer', level: 1 };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  const { tokenId } = params;
  const { searchParams } = new URL(req.url);
  
  // Parse query parameters
  const trustScore = parseInt(searchParams.get('trustScore') || '0', 10);
  const badgeType = parseInt(searchParams.get('badgeType') || '1', 10);
  const badgeName = searchParams.get('badgeName') || '';
  const badgeMessage = searchParams.get('badgeMessage') || '';
  const owner = searchParams.get('owner') || '';
  const verified = searchParams.get('verified') === 'true';
  const timestamp = parseInt(searchParams.get('timestamp') || String(Math.floor(Date.now() / 1000)), 10);
  
  // Get tier information based on trust score
  const tierInfo = getTierInfo(trustScore);
  
  // Prepare metadata response
  const metadata = {
    name: badgeName ? `Graphite Trust Badge #${tokenId}: ${badgeName}` : `Graphite Trust Badge #${tokenId}`,
    description: badgeMessage || 
      `This badge represents a trust score of ${trustScore}, placing the holder in the ${tierInfo.name} tier of the Graphite ecosystem.`,
    image: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/badge-images/${tokenId}`,
    external_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/nfts/view/${tokenId}`,
    attributes: [
      {
        trait_type: "Trust Score",
        value: trustScore
      },
      {
        trait_type: "Trust Tier",
        value: tierInfo.name
      },
      {
        trait_type: "Badge Type",
        value: badgeType
      },
      {
        trait_type: "Verified",
        value: verified
      },
      {
        display_type: "date",
        trait_type: "Last Updated",
        value: timestamp
      }
    ]
  };
  
  // Return the response with appropriate headers
  return new NextResponse(JSON.stringify(metadata), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
} 