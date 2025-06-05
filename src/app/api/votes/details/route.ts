import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, formatUnits } from 'viem';
import { mainnet } from 'viem/chains';
import { getContractConfig } from '@/lib/web3/contract-config';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    const userAddress = searchParams.get('userAddress');
    
    if (!address || !address.startsWith('0x')) {
      return NextResponse.json({ error: 'Invalid vote contract address' }, { status: 400 });
    }
    
    // Create a public client to interact with the blockchain
    const publicClient = createPublicClient({
      chain: mainnet,
      transport: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.infura.io/v3/your-infura-key')
    });
    
    // Get the vote contract ABI
    const voteAbi = getContractConfig('vote').abi;
    
    // Fetch vote details
    const [
      description,
      startTime,
      endTime,
      requiredToken,
      requiredTokenBalance,
      requiredTrustScore,
      requiredKYCLevel,
      proposalCreator,
      totalVotes,
      optionsCount
    ] = await Promise.all([
      publicClient.readContract({
        address: address as `0x${string}`,
        abi: voteAbi,
        functionName: 'description'
      }),
      publicClient.readContract({
        address: address as `0x${string}`,
        abi: voteAbi,
        functionName: 'startTime'
      }),
      publicClient.readContract({
        address: address as `0x${string}`,
        abi: voteAbi,
        functionName: 'endTime'
      }),
      publicClient.readContract({
        address: address as `0x${string}`,
        abi: voteAbi,
        functionName: 'requiredToken'
      }),
      publicClient.readContract({
        address: address as `0x${string}`,
        abi: voteAbi,
        functionName: 'requiredTokenBalance'
      }),
      publicClient.readContract({
        address: address as `0x${string}`,
        abi: voteAbi,
        functionName: 'requiredTrustScore'
      }),
      publicClient.readContract({
        address: address as `0x${string}`,
        abi: voteAbi,
        functionName: 'requiredKYCLevel'
      }),
      publicClient.readContract({
        address: address as `0x${string}`,
        abi: voteAbi,
        functionName: 'proposalCreator'
      }),
      publicClient.readContract({
        address: address as `0x${string}`,
        abi: voteAbi,
        functionName: 'totalVotesCasted'
      }),
      publicClient.readContract({
        address: address as `0x${string}`,
        abi: voteAbi,
        functionName: 'getOptionsCount'
      })
    ]);
    
    // Fetch all options and their vote counts
    const options = [];
    for (let i = 0; i < Number(optionsCount); i++) {
      const [optionText, voteCount] = await Promise.all([
        publicClient.readContract({
          address: address as `0x${string}`,
          abi: voteAbi,
          functionName: 'getOption',
          args: [BigInt(i)]
        }),
        publicClient.readContract({
          address: address as `0x${string}`,
          abi: voteAbi,
          functionName: 'getVoteCount',
          args: [BigInt(i)]
        })
      ]);
      
      options.push({
        index: i,
        text: optionText,
        voteCount: voteCount
      });
    }
    
    // Check if user has voted (if userAddress is provided)
    let hasUserVoted = false;
    let userEligibility = null;
    
    if (userAddress && userAddress.startsWith('0x')) {
      hasUserVoted = await publicClient.readContract({
        address: address as `0x${string}`,
        abi: voteAbi,
        functionName: 'hasVoted',
        args: [userAddress as `0x${string}`]
      }) as boolean;
      
      // Get user eligibility details
      try {
        const eligibilityResult = await publicClient.readContract({
          address: address as `0x${string}`,
          abi: voteAbi,
          functionName: 'getEligibilityDetails',
          args: [userAddress as `0x${string}`]
        }) as any;
        
        // Map numeric status to string status
        const statusMap: Record<number, string> = {
          0: 'Eligible',
          1: 'NotActivated',
          2: 'InsufficientKYC',
          3: 'LowTrustScore',
          4: 'InsufficientTokenBalance',
          5: 'GenericIneligible'
        };
        
        userEligibility = {
          isActiveOnGraphite: eligibilityResult.isActiveOnGraphite,
          userKycLevel: eligibilityResult.userKycLevel,
          userTrustScore: eligibilityResult.userTrustScore,
          userTokenBalance: eligibilityResult.userTokenBalance,
          meetsAllRequirements: eligibilityResult.meetsAllRequirements,
          statusReason: statusMap[Number(eligibilityResult.statusReason)] || 'GenericIneligible'
        };
      } catch (error) {
        console.error('Error fetching user eligibility:', error);
      }
    }
    
    // Format the response
    const voteData = {
      address: address as `0x${string}`,
      description,
      options,
      startTime,
      endTime,
      requiredTrustScore,
      requiredKYCLevel,
      requiredToken: requiredToken === '0x0000000000000000000000000000000000000000' ? null : requiredToken,
      requiredTokenBalance,
      totalVotes,
      proposalCreator,
      hasUserVoted,
      userEligibility
    };
    
    return NextResponse.json(voteData);
  } catch (error) {
    console.error('Error fetching vote details:', error);
    return NextResponse.json({ error: 'Failed to fetch vote details' }, { status: 500 });
  }
} 