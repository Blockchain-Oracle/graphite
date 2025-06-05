import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { getContractConfig } from '@/lib/web3/contract-config';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const index = searchParams.get('index');
    
    if (!index || isNaN(Number(index))) {
      return NextResponse.json({ error: 'Invalid index parameter' }, { status: 400 });
    }
    
    // Create a public client to interact with the blockchain
    const publicClient = createPublicClient({
      chain: mainnet,
      transport: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.infura.io/v3/your-infura-key')
    });
    
    // Get the vote factory contract config
    const voteFactoryConfig = getContractConfig('voteFactory');
    
    // Call the getVoteContractAtIndex function
    const voteAddress = await publicClient.readContract({
      address: voteFactoryConfig.address,
      abi: voteFactoryConfig.abi,
      functionName: 'getVoteContractAtIndex',
      args: [BigInt(index)]
    }) as `0x${string}`;
    
    return NextResponse.json({ address: voteAddress });
  } catch (error) {
    console.error('Error fetching vote contract:', error);
    return NextResponse.json({ error: 'Failed to fetch vote contract' }, { status: 500 });
  }
} 