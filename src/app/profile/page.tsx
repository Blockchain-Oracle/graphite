'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AnimatedList } from '@/components/magicui/animated-list';
import { SparklesText } from '@/components/magicui/sparkles-text';
import { Particles } from '@/components/magicui/particles';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Copy, Check, ExternalLink, Clock, ArrowUpRight, ArrowDownLeft, Shield, ShieldCheck, ShieldAlert, Info, Eye } from 'lucide-react';
import { useUserProfileData } from '@/lib/hooks/useUserProfileData';
import { useUserNFTs } from '@/lib/hooks/useNFTs';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { NFT } from '@/lib/types';

// Mock KYC levels (can be kept for mapping UI, completion status will come from hook)
const KYC_LEVELS = [
  { id: 1, name: 'Basic', description: 'Email verification' },
  { id: 2, name: 'Standard', description: 'ID verification' },
  { id: 3, name: 'Advanced', description: 'Address proof' },
  { id: 4, name: 'Premium', description: 'Video verification' },
];

// Mock transaction history (remains mock for now)
const MOCK_TRANSACTIONS = [
  {
    id: 'tx1',
    type: 'received',
    amount: '50 TRUST',
    from: '0xabcd...1234',
    to: '0xFETCHEDADDRESS', // Placeholder, will be replaced if needed or kept if transactions are user-specific
    timestamp: Date.now() - 1000 * 60 * 15, // 15 minutes ago
    hash: '0xabcdef1234567890abcdef1234567890',
  },
  // ... other transactions
];

// Typing Animation Component
function TypingAnimation({ text, delay = 50 }: { text: string; delay?: number }) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, delay);
      
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, delay, text]);

  return (
    <div className="font-medium">
      {displayText}
      {currentIndex < text.length && <span className="animate-pulse">|</span>}
    </div>
  );
}

// Format timestamp to relative time
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60 * 1000) {
    return 'Just now';
  } else if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  } else if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

// Truncate address for display
function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function ProfilePage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [isAddressCopied, setIsAddressCopied] = useState(false);

  const { 
    trustScore, 
    isTrustScoreLoading, 
    trustScoreError, 
    kycLevel: fetchedKycLevel, 
    isKycLevelLoading, 
    kycLevelError, 
    isLoading: isProfileDataLoading,
    refetchUserProfileData 
  } = useUserProfileData(address);

  const { 
    nfts, 
    isLoading: isNftsLoading, 
    error: nftsError,
    refetchBalance: refetchNfts
  } = useUserNFTs(address);

  const [animatedTrustScore, setAnimatedTrustScore] = useState(0);

  useEffect(() => {
    if (trustScore !== null) {
      let start = 0;
      const end = trustScore;
      if (end === start) {
        setAnimatedTrustScore(end);
        return;
      }
      const increment = Math.max(1, Math.ceil(Math.abs(end - start) / 30));
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setAnimatedTrustScore(end);
          clearInterval(timer);
        } else {
          setAnimatedTrustScore(start);
        }
      }, 50);
      return () => clearInterval(timer);
    } else {
      setAnimatedTrustScore(0);
    }
  }, [trustScore]);
  
  const copyAddressToClipboard = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setIsAddressCopied(true);
      setTimeout(() => setIsAddressCopied(false), 2000);
    }
  };
  
  const getTrustLevel = (score: number | null) => {
    if (score === null) return { level: 0, color: 'bg-neutral-500', text: 'N/A' };
    if (score >= 800) return { level: 5, color: 'bg-pink-500', text: 'Exceptional' };
    if (score >= 600) return { level: 4, color: 'bg-yellow-500', text: 'High' };
    if (score >= 400) return { level: 3, color: 'bg-purple-500', text: 'Good' };
    if (score >= 200) return { level: 2, color: 'bg-green-500', text: 'Moderate' };
    return { level: 1, color: 'bg-blue-500', text: 'Basic' };
  };
  
  const trustLevelDetails = getTrustLevel(trustScore);

  if (!isConnected && !isProfileDataLoading && !isNftsLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-gray-100 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <SparklesText className="text-3xl sm:text-4xl font-bold text-white mb-4">Connect Your Wallet</SparklesText>
        <p className="text-neutral-400 mb-6 text-center">Please connect your wallet to view your profile.</p>
      </div>
    );
  }
  
  const displayTransactions = MOCK_TRANSACTIONS.map(tx => ({
    ...tx,
    to: tx.type === 'received' && address ? address : tx.to,
    from: tx.type === 'sent' && address ? address : tx.from,
  }));

  return (
    <div className="container mx-auto px-4 py-8 text-gray-100">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <Particles
            className="absolute inset-0"
            quantity={200}
            color="#555"
            vy={-0.1}
          />
        </div>
        
        <div className="relative z-10">
          <div className="mb-8 text-center">
            <SparklesText className="text-4xl sm:text-5xl font-bold text-white">
              Your Profile
            </SparklesText>
            <div className="h-20 flex items-center justify-center mt-4">
              <TypingAnimation text="Welcome back to your Graphite Trust dashboard. Manage your identity and trust score." />
            </div>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="col-span-1">
              <Card className="backdrop-blur-md bg-neutral-800/60 border border-neutral-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-100">
                    <Avatar className="h-6 w-6">
                      {address ? <img src={`https://effigy.im/a/${address}.svg`} alt="Avatar" /> : <div className="h-full w-full bg-neutral-600 rounded-full" />}
                    </Avatar>
                    <span>Account Overview</span>
                  </CardTitle>
                  <CardDescription className="text-gray-400">Manage your account details and identity</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-300">Connected Wallet</div>
                    <div className="flex items-center justify-between p-3 bg-neutral-700/50 rounded-lg">
                      <code className="text-sm text-gray-100">{address ? truncateAddress(address) : 'N/A'}</code>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={copyAddressToClipboard}
                        className="h-8 w-8 text-gray-300 hover:text-white"
                        disabled={!address}
                      >
                        {isAddressCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    {address && (
                      <div className="flex items-center justify-end text-xs text-gray-400">
                        <a 
                          href={`https://etherscan.io/address/${address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center hover:underline text-blue-400 hover:text-blue-300"
                        >
                          View on Etherscan
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-300">Trust Score</div>
                      <Badge className={`${trustLevelDetails.color} text-white font-semibold`}>
                        Tier {trustLevelDetails.level} - {trustLevelDetails.text}
                      </Badge>
                    </div>
                    
                    <div className="p-4 bg-neutral-700/50 rounded-lg text-center space-y-3">
                      {isTrustScoreLoading && <Skeleton className="h-8 w-1/3 mx-auto" />}
                      {trustScoreError && <p className="text-red-400 text-xs">{trustScoreError.message || 'Error loading score'}</p>}
                      {!isTrustScoreLoading && !trustScoreError && trustScore !== null && (
                        <div className="text-3xl font-bold text-gray-100">{animatedTrustScore}</div>
                      )}
                       {!isTrustScoreLoading && !trustScoreError && trustScore === null && (
                        <div className="text-3xl font-bold text-gray-100">N/A</div>
                      )}
                      <Progress value={trustScore !== null ? (animatedTrustScore / 1000) * 100 : 0} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>0</span>
                        <span>1000</span>
                      </div>
                    </div>
                    
                    <div className="text-center mt-2">
                      <Button
                        variant="outline" 
                        size="sm"
                        className="text-xs text-gray-300 border-gray-600 hover:bg-neutral-700 hover:text-white"
                        onClick={() => router.push('/dashboard')}
                      >
                        View Score Breakdown
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="backdrop-blur-md bg-neutral-800/60 border border-neutral-700 mt-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-100">
                    <Shield className="h-5 w-5" />
                    <span>Identity Verification</span>
                  </CardTitle>
                  <CardDescription className="text-gray-400">Complete verification to access more features</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-300">Current KYC Level</div>
                    {isKycLevelLoading && <Skeleton className="h-6 w-24" />}
                    {kycLevelError && <span className="text-xs text-red-400">{kycLevelError.message || 'Error loading KYC'}</span>}
                    {!isKycLevelLoading && !kycLevelError && fetchedKycLevel !== null && (
                      <Badge className={`${fetchedKycLevel >= KYC_LEVELS.find(l => l.name === 'Advanced')?.id! ? "bg-green-600" : "bg-yellow-600"} text-white font-semibold`}>
                        {KYC_LEVELS[fetchedKycLevel - 1]?.name || 'Unknown Level'}
                      </Badge>
                    )}
                    {!isKycLevelLoading && !kycLevelError && fetchedKycLevel === null && (
                       <Badge className="bg-neutral-600 text-white font-semibold">Not Set</Badge>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {KYC_LEVELS.map((level) => {
                      const isCompleted = fetchedKycLevel !== null && level.id < fetchedKycLevel;
                      const isCurrent = fetchedKycLevel !== null && level.id === fetchedKycLevel;
                      const isPending = fetchedKycLevel === null || level.id > fetchedKycLevel;

                      return (
                        <div 
                          key={level.id}
                          className={`p-3 rounded-lg border flex items-center justify-between ${
                            isCurrent
                              ? 'bg-primary/20 border-primary'
                              : isCompleted
                                ? 'bg-green-600/20 border-green-500/40'
                                : 'bg-neutral-700/50 border-neutral-600'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                              isCompleted || isCurrent
                                ? 'bg-green-500 text-white'
                                : 'bg-neutral-600 text-gray-300'
                            }`}>
                              {(isCompleted || isCurrent) ? (
                                <ShieldCheck className="h-4 w-4" />
                              ) : (
                                <Shield className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-100">Level {level.id}: {level.name}</div>
                              <div className="text-xs text-gray-400">
                                {level.description}
                              </div>
                            </div>
                          </div>
                          
                          {(isPending && !isKycLevelLoading) && (
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary/80 text-white"
                              onClick={() => alert(`Starting verification for Level ${level.id}: ${level.name}`)}
                            >
                              Verify
                            </Button>
                          )}
                          
                          {isCurrent && <Badge className="bg-blue-500 text-white">Current</Badge>}
                          
                          {isCompleted && (
                            <Badge variant="outline" className="bg-green-600/20 text-green-400 border-green-500/40">
                              Verified
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
                
                <CardFooter className="border-t border-neutral-700 px-6 py-4 flex justify-between">
                  <div className="flex items-start">
                    <Info className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                    <p className="text-xs text-gray-400">Higher verification levels increase your trust score and unlock more features.</p>
                  </div>
                </CardFooter>
              </Card>
            </div>
            
            <div className="col-span-1 xl:col-span-2">
              <Card className="backdrop-blur-md bg-neutral-800/60 border border-neutral-700 h-full">
                <CardHeader>
                  <CardTitle className="text-gray-100">Activity & History</CardTitle>
                  <CardDescription className="text-gray-400">View your transactions, NFTs, and trust score history</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <Tabs defaultValue="nfts" className="w-full">
                    <TabsList className="grid grid-cols-3 w-full bg-neutral-700/50 rounded-md">
                      <TabsTrigger value="nfts" className="data-[state=active]:bg-primary data-[state=active]:text-white text-gray-300">My NFTs</TabsTrigger>
                      <TabsTrigger value="transactions" className="data-[state=active]:bg-primary data-[state=active]:text-white text-gray-300">Transactions</TabsTrigger>
                      <TabsTrigger value="trust-history" className="data-[state=active]:bg-primary data-[state=active]:text-white text-gray-300">Trust Score History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="nfts" className="pt-4">
                      {isNftsLoading && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {[...Array(3)].map((_, index) => (
                            <Card key={index} className="bg-neutral-700/50 border-neutral-600">
                              <CardContent className="p-4 space-y-2">
                                <Skeleton className="h-32 w-full rounded-md" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                      {nftsError && (
                        <p className="text-red-400 text-center">Error loading NFTs: {nftsError.message}</p>
                      )}
                      {!isNftsLoading && !nftsError && nfts.length === 0 && (
                        <p className="text-neutral-400 text-center py-8">You don't own any Graphite Trust NFTs yet.</p>
                      )}
                      {!isNftsLoading && !nftsError && nfts.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                          {nfts.map((nft) => (
                            <Card key={nft.id} className="bg-neutral-700/50 border-neutral-600 overflow-hidden hover:border-primary/70 transition-all group">
                              <CardHeader className="p-0 relative">
                                <img 
                                  src={nft.image} 
                                  alt={nft.name} 
                                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <Badge className="absolute top-2 right-2 bg-primary text-white">{nft.tier.replace('TIER_', 'Tier ')}</Badge>
                              </CardHeader>
                              <CardContent className="p-4">
                                <CardTitle className="text-lg text-gray-100 truncate group-hover:text-primary transition-colors">{nft.name}</CardTitle>
                                <p className="text-sm text-gray-400 mt-1">Trust Score: {nft.trustScore}</p>
                                <p className="text-xs text-gray-500 mt-2">Owner: {truncateAddress(nft.owner)}</p>
                              </CardContent>
                              <CardFooter className="p-4 border-t border-neutral-600/50">
                                <Button 
                                  variant="ghost" 
                                  className="w-full text-primary hover:bg-primary/10 hover:text-primary-focus"
                                  onClick={() => router.push(`/nfts/view/${nft.tokenId}`)}
                                >
                                  View Details <Eye className="ml-2 h-4 w-4" />
                                </Button>
                              </CardFooter>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="transactions" className="pt-4 space-y-4">
                      <AnimatedList 
                        items={displayTransactions}
                        keyExtractor={(transaction) => transaction.id}
                        staggerDelay={0.05}
                        className="space-y-3"
                        renderItem={(transaction) => (
                          <div 
                            className="p-4 bg-neutral-700/50 rounded-lg flex items-center justify-between border border-neutral-600"
                          >
                            <div className="flex items-center">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 ${
                                transaction.type === 'received' 
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {transaction.type === 'received' ? (
                                  <ArrowDownLeft className="h-5 w-5" />
                                ) : (
                                  <ArrowUpRight className="h-5 w-5" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-gray-100">
                                  {transaction.type === 'received' 
                                    ? `Received ${transaction.amount}`
                                    : `Sent ${transaction.amount}`}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {transaction.type === 'received'
                                    ? `From: ${truncateAddress(transaction.from)}`
                                    : `To: ${truncateAddress(transaction.to)}`}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end">
                              <div className="text-xs text-gray-400 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatRelativeTime(transaction.timestamp)}
                              </div>
                              <div className="text-xs text-blue-400 mt-1 hover:underline hover:text-blue-300 cursor-pointer">
                                <a
                                  href={`https://etherscan.io/tx/${transaction.hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center"
                                >
                                  View Transaction
                                  <ExternalLink className="ml-1 h-3 w-3" />
                                </a>
                              </div>
                            </div>
                          </div>
                        )}
                      />
                      
                      <div className="flex justify-center mt-4">
                        <Button variant="outline" className="text-gray-300 border-gray-600 hover:bg-neutral-700 hover:text-white">View All Transactions</Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="trust-history" className="pt-4">
                      {isTrustScoreLoading && <div className="text-center py-4"><Skeleton className="h-64 w-full" /></div>}
                      {trustScoreError && <p className="text-red-400 text-center">Error loading trust score history.</p>}
                      {!isTrustScoreLoading && !trustScoreError && trustScore === null && (
                        <p className="text-neutral-400 text-center py-8">Trust score history not available.</p>
                      )}
                      {!isTrustScoreLoading && !trustScoreError && trustScore !== null && (
                        <div className="flex flex-col space-y-6">
                          <div className="h-64 p-4 bg-neutral-700/50 rounded-lg relative border border-neutral-600">
                            {/* Placeholder for actual chart */}
                            <div className="flex items-center justify-center h-full">
                              <p className="text-neutral-500">Trust Score History Chart (Coming Soon)</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="overflow-hidden bg-neutral-700/30 border-neutral-600">
                              <CardHeader className="p-4">
                                <CardTitle className="text-lg text-gray-100">Trust Score Milestones</CardTitle>
                              </CardHeader>
                              <CardContent className="p-4">
                                {/* Placeholder for milestones */}
                                <p className="text-neutral-500 text-sm">Milestones display (Coming Soon)</p>
                              </CardContent>
                            </Card>
                            
                            <Card className="overflow-hidden bg-neutral-700/30 border-neutral-600">
                              <CardHeader className="p-4">
                                <CardTitle className="text-lg text-gray-100">Improvement Suggestions</CardTitle>
                              </CardHeader>
                              <CardContent className="p-4">
                                <AnimatedList 
                                  items={[
                                    { points: 50, title: 'Complete Advanced KYC', description: 'Verify your address to increase your trust score.' },
                                    { points: 30, title: 'Link Social Media', description: 'Connect your verified social media accounts.' },
                                    { points: 100, title: 'Successful Transactions', description: 'Complete 10 more successful transactions.' }
                                  ]}
                                  keyExtractor={(item) => item.title}
                                  staggerDelay={0.05}
                                  className="space-y-3"
                                  renderItem={(item) => (
                                    <div className="p-3 bg-neutral-700/50 rounded-lg border border-neutral-600">
                                      <div className="flex items-center space-x-2">
                                        <Badge className="bg-green-500 text-white">+{item.points} Points</Badge>
                                        <div className="font-medium text-gray-100">{item.title}</div>
                                      </div>
                                      <p className="text-xs text-gray-400 mt-1">
                                        {item.description}
                                      </p>
                                    </div>
                                  )}
                                />
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 