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
import { Copy, Check, ExternalLink, Clock, ArrowUpRight, ArrowDownLeft, Shield, ShieldCheck, ShieldAlert, Info } from 'lucide-react';

// Mock data (to be replaced with blockchain data)
const MOCK_ADDRESS = '0x1234567890123456789012345678901234567890';

// Mock trust score history
const MOCK_TRUST_SCORE_HISTORY = [
  { date: '2023-08-01', score: 350 },
  { date: '2023-09-01', score: 420 },
  { date: '2023-10-01', score: 510 },
  { date: '2023-11-01', score: 580 },
  { date: '2023-12-01', score: 650 },
  { date: '2024-01-01', score: 680 },
  { date: '2024-02-01', score: 750 },
];

// Mock KYC levels
const KYC_LEVELS = [
  { id: 1, name: 'Basic', description: 'Email verification', completed: true },
  { id: 2, name: 'Standard', description: 'ID verification', completed: true },
  { id: 3, name: 'Advanced', description: 'Address proof', completed: false },
  { id: 4, name: 'Premium', description: 'Video verification', completed: false },
];

// Mock transaction history
const MOCK_TRANSACTIONS = [
  {
    id: 'tx1',
    type: 'received',
    amount: '50 TRUST',
    from: '0xabcd...1234',
    to: MOCK_ADDRESS,
    timestamp: Date.now() - 1000 * 60 * 15, // 15 minutes ago
    hash: '0xabcdef1234567890abcdef1234567890',
  },
  {
    id: 'tx2',
    type: 'sent',
    amount: '20 TRUST',
    from: MOCK_ADDRESS,
    to: '0xdef0...5678',
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    hash: '0x1234567890abcdef1234567890abcdef',
  },
  {
    id: 'tx3',
    type: 'received',
    amount: '100 TRUST',
    from: '0x9876...5432',
    to: MOCK_ADDRESS,
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    hash: '0x9876543210fedcba9876543210fedcba',
  },
  {
    id: 'tx4',
    type: 'sent',
    amount: '15 TRUST',
    from: MOCK_ADDRESS,
    to: '0x4567...8901',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
    hash: '0xfedcba9876543210fedcba9876543210',
  },
  {
    id: 'tx5',
    type: 'received',
    amount: '75 TRUST',
    from: '0x2345...6789',
    to: MOCK_ADDRESS,
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 days ago
    hash: '0x5432109876fedcba5432109876fedcba',
  },
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
  const { address } = useAccount();
  const [copied, setCopied] = useState(false);
  const [currentTrustScore, setCurrentTrustScore] = useState(0);
  const [kycLevel, setKycLevel] = useState(2); // Default to level 2 (Standard)
  
  // Use the connected address or mock address
  const userAddress = address || MOCK_ADDRESS;
  
  // Get current trust score from history
  useEffect(() => {
    if (MOCK_TRUST_SCORE_HISTORY.length > 0) {
      const latestScore = MOCK_TRUST_SCORE_HISTORY[MOCK_TRUST_SCORE_HISTORY.length - 1].score;
      
      // Animate trust score counting up
      let start = 0;
      const increment = Math.ceil(latestScore / 30); // Divide animation into ~30 steps
      const timer = setInterval(() => {
        start += increment;
        if (start >= latestScore) {
          setCurrentTrustScore(latestScore);
          clearInterval(timer);
        } else {
          setCurrentTrustScore(start);
        }
      }, 50);
      
      return () => clearInterval(timer);
    }
  }, []);
  
  // Copy address to clipboard
  const copyAddressToClipboard = () => {
    navigator.clipboard.writeText(userAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Trust score level (1-5) based on current score
  const getTrustLevel = (score: number) => {
    if (score >= 800) return { level: 5, color: 'bg-pink-500', text: 'Exceptional' };
    if (score >= 600) return { level: 4, color: 'bg-yellow-500', text: 'High' };
    if (score >= 400) return { level: 3, color: 'bg-purple-500', text: 'Good' };
    if (score >= 200) return { level: 2, color: 'bg-green-500', text: 'Moderate' };
    return { level: 1, color: 'bg-blue-500', text: 'Basic' };
  };
  
  const trustLevel = getTrustLevel(currentTrustScore);

  return (
    <div className="container mx-auto px-4 py-8 text-gray-100">
      <div className="relative overflow-hidden">
        {/* Background particles */}
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
            <SparklesText
              className="text-4xl sm:text-5xl font-bold text-white"
            >
              Your Profile
            </SparklesText>
            <div className="h-20 flex items-center justify-center mt-4">
              <TypingAnimation text="Welcome back to your Graphite Trust dashboard. Manage your identity and trust score." />
            </div>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column - Account Overview */}
            <div className="col-span-1">
              <Card className="backdrop-blur-md bg-neutral-800/60 border border-neutral-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-100">
                    <Avatar className="h-6 w-6">
                      <img src={`https://effigy.im/a/${userAddress}.svg`} alt="Avatar" />
                    </Avatar>
                    <span>Account Overview</span>
                  </CardTitle>
                  <CardDescription className="text-gray-400">Manage your account details and identity</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Wallet Address */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-300">Connected Wallet</div>
                    <div className="flex items-center justify-between p-3 bg-neutral-700/50 rounded-lg">
                      <code className="text-sm text-gray-100">{truncateAddress(userAddress)}</code>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={copyAddressToClipboard}
                        className="h-8 w-8 text-gray-300 hover:text-white"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="flex items-center justify-end text-xs text-gray-400">
                      <a 
                        href={`https://etherscan.io/address/${userAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center hover:underline text-blue-400 hover:text-blue-300"
                      >
                        View on Etherscan
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  
                  {/* Trust Score */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-300">Trust Score</div>
                      <Badge
                        className={`${trustLevel.color} text-white font-semibold`}
                      >
                        Tier {trustLevel.level} - {trustLevel.text}
                      </Badge>
                    </div>
                    
                    <div className="p-4 bg-neutral-700/50 rounded-lg text-center space-y-3">
                      <div className="text-3xl font-bold text-gray-100">{currentTrustScore}</div>
                      <Progress value={(currentTrustScore / 1000) * 100} className="h-2" />
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
              
              {/* KYC Status */}
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
                    <Badge className={`${kycLevel >= 3 ? "bg-green-600" : "bg-yellow-600"} text-white font-semibold`}>
                      {KYC_LEVELS[kycLevel - 1].name}
                    </Badge>
                  </div>
                  
                  <div className="space-y-4">
                    {KYC_LEVELS.map((level) => (
                      <div 
                        key={level.id}
                        className={`p-3 rounded-lg border flex items-center justify-between ${
                          level.id === kycLevel
                            ? 'bg-primary/20 border-primary'
                            : level.completed
                              ? 'bg-green-600/20 border-green-500/40'
                              : 'bg-neutral-700/50 border-neutral-600'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                            level.id <= kycLevel
                              ? 'bg-green-500 text-white'
                              : 'bg-neutral-600 text-gray-300'
                          }`}>
                            {level.completed ? (
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
                        
                        {level.id > kycLevel && (
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/80 text-white"
                            onClick={() => alert(`Starting verification for Level ${level.id}: ${level.name}`)}
                          >
                            Verify
                          </Button>
                        )}
                        
                        {level.id === kycLevel && (
                          <Badge className="bg-blue-500 text-white">Current</Badge>
                        )}
                        
                        {level.id < kycLevel && (
                          <Badge variant="outline" className="bg-green-600/20 text-green-400 border-green-500/40">
                            Verified
                          </Badge>
                        )}
                      </div>
                    ))}
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
            
            {/* Right Column - History and Activity */}
            <div className="col-span-1 xl:col-span-2">
              <Card className="backdrop-blur-md bg-neutral-800/60 border border-neutral-700 h-full">
                <CardHeader>
                  <CardTitle className="text-gray-100">Activity & History</CardTitle>
                  <CardDescription className="text-gray-400">View your transactions and trust score history</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <Tabs defaultValue="transactions" className="w-full">
                    <TabsList className="grid grid-cols-2 w-full bg-neutral-700/50 rounded-md">
                      <TabsTrigger value="transactions" className="data-[state=active]:bg-primary data-[state=active]:text-white text-gray-300">Transactions</TabsTrigger>
                      <TabsTrigger value="trust-history" className="data-[state=active]:bg-primary data-[state=active]:text-white text-gray-300">Trust Score History</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="transactions" className="pt-4 space-y-4">
                      <AnimatedList 
                        items={MOCK_TRANSACTIONS}
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
                      {MOCK_TRUST_SCORE_HISTORY.length > 0 && (
                        <div className="flex flex-col space-y-6">
                          <div className="h-64 p-4 bg-neutral-700/50 rounded-lg relative border border-neutral-600">
                            {/* Simple trust score chart */}
                            <div className="absolute inset-0 flex p-2">
                              {MOCK_TRUST_SCORE_HISTORY.map((item, index) => {
                                const height = (item.score / 1000) * 100;
                                return (
                                  <div
                                    key={index}
                                    className="flex-1 flex flex-col justify-end items-center pr-1 last:pr-0 group"
                                  >
                                    <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1">{item.score}</div>
                                    <div 
                                      className="bg-primary rounded-t w-3/4 hover:opacity-80 transition-opacity"
                                      style={{ height: `${height}%` }}
                                      title={`${new Date(item.date).toLocaleDateString()}: ${item.score} pts`}
                                    ></div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="overflow-hidden bg-neutral-700/30 border-neutral-600">
                              <CardHeader className="p-4">
                                <CardTitle className="text-lg text-gray-100">Trust Score Milestones</CardTitle>
                              </CardHeader>
                              <CardContent className="p-4">
                                <AnimatedList 
                                  items={MOCK_TRUST_SCORE_HISTORY}
                                  keyExtractor={(item) => item.date}
                                  staggerDelay={0.05}
                                  className="space-y-3"
                                  renderItem={(item, index) => {
                                    const prevScore = index > 0 ? MOCK_TRUST_SCORE_HISTORY[index - 1].score : 0;
                                    const change = item.score - prevScore;
                                    const isPositive = change > 0;
                                    
                                    return (
                                      <div 
                                        className="flex items-center justify-between p-3 bg-neutral-700/50 rounded-lg border border-neutral-600"
                                      >
                                        <div>
                                          <div className="text-sm font-medium text-gray-100">{item.score} Points</div>
                                          <div className="text-xs text-gray-400">
                                            {new Date(item.date).toLocaleDateString()}
                                          </div>
                                        </div>
                                        {index > 0 && (
                                          <div className={`text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                            {isPositive ? '+' : ''}{change}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }}
                                />
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