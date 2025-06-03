import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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
  const { searchParams } = new URL(req.url);
  const trustScore = parseInt(searchParams.get('trustScore') || '0', 10);
  
  // Determine tier level based on trust score
  const tierLevel = getTierLevel(trustScore);
  
  try {
    // Get the corresponding SVG file from the public directory
    const filePath = path.join(process.cwd(), 'public', 'trust-badges', `tier-${tierLevel}.svg`);
    const imageBuffer = fs.readFileSync(filePath);
    
    // Return the SVG image with appropriate headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
      }
    });
  } catch (error) {
    console.error('Error serving badge image:', error);
    
    // Return a fallback SVG if the specified tier image cannot be found
    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="#ccc" />
      <text x="50" y="55" font-family="Arial" font-size="20" text-anchor="middle" fill="white">Badge</text>
    </svg>`;
    
    return new NextResponse(fallbackSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Access-Control-Allow-Origin': '*'
      },
      status: 500
    });
  }
} 