'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CUSTOMIZATION_OPTIONS, NFTTier, getUserEligibleTier } from '@/lib/types';
import { useMintNFT } from '@/lib/hooks/useNFTs';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

// Import components with Three.js dependencies dynamically
const Confetti = dynamic(
  () => import('@/components/magicui/confetti').then(mod => mod.Confetti),
  { ssr: false }
);

const CoolMode = dynamic(
  () => import('@/components/magicui/cool-mode').then(mod => mod.CoolMode),
  { ssr: false }
);

// For prototype purposes - in a real app this would come from the user's wallet
const MOCK_USER_TRUST_SCORE = 650;
const MOCK_USER_ADDRESS = '0x1234567890123456789012345678901234567890';

interface ModelOption {
  id: string;
  name: string;
  description: string;
  image: string;
  minTrustScore: number;
  tier: NFTTier;
}

// Mock available models based on trust score tiers
const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'tier-1-guardian',
    name: 'Tier 1 Guardian',
    description: 'The foundational level of trust guardian.',
    image: '/trust-badges/tier-1.svg',
    minTrustScore: 0,
    tier: NFTTier.TIER_1
  },
  {
    id: 'tier-2-guardian',
    name: 'Tier 2 Guardian',
    description: 'A guardian indicating a growing level of trust.',
    image: '/trust-badges/tier-2.svg',
    minTrustScore: 200,
    tier: NFTTier.TIER_2
  },
  {
    id: 'tier-3-guardian',
    name: 'Tier 3 Guardian',
    description: 'A guardian signifying a strong trust history.',
    image: '/trust-badges/tier-3.svg',
    minTrustScore: 400,
    tier: NFTTier.TIER_3
  },
  {
    id: 'tier-4-guardian',
    name: 'Tier 4 Guardian',
    description: 'An elite guardian demonstrating high trustworthiness.',
    image: '/trust-badges/tier-4.svg',
    minTrustScore: 600,
    tier: NFTTier.TIER_4
  },
  {
    id: 'tier-5-guardian',
    name: 'Tier 5 Guardian',
    description: 'The ultimate guardian, representing the pinnacle of trust.',
    image: '/trust-badges/tier-5.svg',
    minTrustScore: 800,
    tier: NFTTier.TIER_5
  }
];

export default function MintNFTPage() {
  const router = useRouter();
  const [userTrustScore] = useState(MOCK_USER_TRUST_SCORE);
  const [selectedModelIndex, setSelectedModelIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const { mint, isProcessing, isSuccess, error: mintError, hash } = useMintNFT();
  
  // Filter available models based on user's trust score
  const eligibleModels = AVAILABLE_MODELS.filter(
    (model) => userTrustScore >= model.minTrustScore
  );
  
  // If no eligible models, default to the first (lowest tier) model
  const displayedModels = eligibleModels.length > 0 ? eligibleModels : [AVAILABLE_MODELS[0]];
  const selectedModel = displayedModels[selectedModelIndex];
  
  // Handle next model in carousel
  const handleNextModel = () => {
    setSelectedModelIndex((prev) => (prev + 1) % displayedModels.length);
  };
  
  // Handle previous model in carousel
  const handlePrevModel = () => {
    setSelectedModelIndex((prev) => 
      prev === 0 ? displayedModels.length - 1 : prev - 1
    );
  };
  
  // Handle mint NFT
  const handleMint = async () => {
    if (!selectedModel || isProcessing) return;
    
    try {
      await mint();
    } catch (error) {
      console.error('Error initiating minting process:', error);
    }
  };

  // Effect to handle successful minting
  useEffect(() => {
    if (isSuccess) {
      setShowConfetti(true);
      setTimeout(() => {
        router.push('/nfts/gallery');
      }, 3000);
    }
  }, [isSuccess, router]);

  return (
    <div className="container mx-auto px-4 py-8">
      {showConfetti && <Confetti />}
      
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <div className="inline-block">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Mint Your Trust Guardian
            </h1>
            <div className="h-1 w-full bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 rounded-full"></div>
          </div>
          
          <div className="mt-4 text-lg text-muted-foreground leading-relaxed">
            <TypeAnimationEffect 
              text="Based on your trust score, you can mint a Guardian NFT. Higher trust scores unlock more powerful Guardians." 
            />
          </div>
          
          {isSuccess && hash && (
            <div className="mt-6 p-4 bg-green-100/10 border border-green-500/30 rounded-lg">
              <p className="text-green-500 font-semibold">
                Successfully minted your Guardian NFT!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Transaction: <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">{hash.substring(0,10)}...{hash.substring(hash.length-8)}</a>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Redirecting to your gallery...
              </p>
            </div>
          )}
          
          {mintError && (
            <div className="mt-6 p-4 bg-red-100/10 border border-red-500/30 rounded-lg">
              <p className="text-red-500">
                Error minting NFT: {mintError.message}
              </p>
            </div>
          )}
        </div>
        
        <div className="bg-black/5 backdrop-blur-lg rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Eligibility Check</h2>
            <span className={`px-3 py-1 rounded-full text-sm ${
              userTrustScore >= 500 ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
            }`}>
              Trust Score: {userTrustScore}
            </span>
          </div>
          
          <div className="space-y-2">
            {AVAILABLE_MODELS.map((model) => (
              <div 
                key={model.id} 
                className={`flex items-center p-3 rounded-md ${
                  userTrustScore >= model.minTrustScore 
                    ? 'bg-green-500/10 border border-green-500/30' 
                    : 'bg-gray-500/10 border border-gray-500/20 opacity-50'
                }`}
              >
                <div className="w-8 h-8 flex-shrink-0 mr-3">
                  {userTrustScore >= model.minTrustScore ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v3m0-3h3m-3 0h-3" />
                    </svg>
                  )}
                </div>
                <div>
                  <span className="font-medium">{model.name}</span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    (Requires {model.minTrustScore} Trust Score)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Select Your Guardian</h2>
          
          <div className="relative">
            <div className="absolute top-1/2 left-4 transform -translate-y-1/2 z-10">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full"
                onClick={handlePrevModel}
                disabled={displayedModels.length <= 1}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
            </div>
            
            <div className="relative overflow-hidden rounded-lg bg-black/5">
              <div className="aspect-video flex items-center justify-center p-4">
                <div className="w-full max-w-xs">
                  <img 
                    src={selectedModel.image} 
                    alt={selectedModel.name}
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
              
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                <h3 className="text-xl font-semibold text-white">
                  {selectedModel.name}
                </h3>
                <p className="text-sm text-white/80">
                  {selectedModel.description}
                </p>
              </div>
            </div>
            
            <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-10">
              <Button 
                variant="outline" 
                size="icon"
                className="rounded-full"
                onClick={handleNextModel}
                disabled={displayedModels.length <= 1}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </div>
          
          <div className="flex justify-center mt-4">
            {displayedModels.map((model, index) => (
              <button
                key={model.id}
                className={`w-2 h-2 mx-1 rounded-full ${
                  index === selectedModelIndex
                    ? 'bg-primary'
                    : 'bg-gray-300'
                }`}
                onClick={() => setSelectedModelIndex(index)}
              />
            ))}
          </div>
        </div>
        
        <div className="flex justify-center">
          <CoolMode>
            <Button
              className="px-8 py-6 text-lg"
              onClick={handleMint}
              disabled={isProcessing || isSuccess}
            >
              {isProcessing && 'Minting...'}
              {isSuccess && 'Minted!'}
              {!isProcessing && !isSuccess && `Mint ${selectedModel.name}`}
            </Button>
          </CoolMode>
        </div>
      </div>
    </div>
  );
}

// Typing animation effect component
function TypeAnimationEffect({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayedText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <p>
      {displayedText}
      <span className="animate-pulse">|</span>
    </p>
  );
} 