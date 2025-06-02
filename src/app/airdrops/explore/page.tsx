"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Search, Filter, Wallet, X } from "lucide-react";
import { AirdropCard, AirdropData } from "@/components/web3/airdrop-card";
import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";
import { Marquee } from "@/components/magicui/marquee";
import { Particles } from "@/components/magicui/particles";
import { Confetti } from "@/components/magicui/confetti";

// Mock data for airdrops
const MOCK_FEATURED_AIRDROPS: AirdropData[] = [
  {
    id: "1",
    name: "Graphite Token",
    symbol: "GRT",
    amount: 100,
    logoUrl: "https://picsum.photos/200/200",
    creatorName: "Graphite Team",
    creatorAddress: "0x1234...5678",
    startDate: "2023-10-01T00:00:00Z",
    endDate: "2023-11-01T00:00:00Z",
    claimers: 1250,
    totalTokens: 1000000,
    isEligible: true,
    hasClaimed: false,
    description: "Claim your Graphite governance tokens to participate in protocol decisions.",
    type: "ERC20",
    status: "active",
  },
  {
    id: "2",
    name: "Rapid Innovation",
    symbol: "RPI",
    amount: 50,
    logoUrl: "https://picsum.photos/200/200?random=1",
    creatorName: "Innovation Labs",
    creatorAddress: "0xabcd...efgh",
    startDate: "2023-09-15T00:00:00Z",
    endDate: "2023-12-15T00:00:00Z",
    claimers: 875,
    totalTokens: 500000,
    isEligible: true,
    hasClaimed: false,
    description: "RPI tokens for the most innovative DeFi platform.",
    type: "ERC20",
    status: "active",
  },
  {
    id: "3",
    name: "PwC Web3",
    symbol: "PW3",
    amount: 25,
    logoUrl: "https://picsum.photos/200/200?random=2",
    creatorName: "PwC Blockchain",
    creatorAddress: "0xijkl...mnop",
    startDate: "2023-10-10T00:00:00Z",
    endDate: "2023-11-10T00:00:00Z",
    claimers: 625,
    totalTokens: 250000,
    isEligible: true,
    hasClaimed: false,
    description: "Join the PwC Web3 ecosystem with these governance tokens.",
    type: "ERC20",
    status: "active",
  },
  {
    id: "4",
    name: "Harvard Review NFT",
    symbol: "HBNFT",
    amount: 1,
    logoUrl: "https://picsum.photos/200/200?random=3",
    creatorName: "Harvard Business",
    creatorAddress: "0xqrst...uvwx",
    startDate: "2023-10-20T00:00:00Z",
    endDate: "2023-12-20T00:00:00Z",
    claimers: 450,
    totalTokens: 1000,
    isEligible: false,
    hasClaimed: false,
    description: "Exclusive NFT for Harvard Business Review contributors.",
    type: "ERC721",
    status: "active",
  },
];

const MOCK_ALL_AIRDROPS: AirdropData[] = [
  ...MOCK_FEATURED_AIRDROPS,
  {
    id: "5",
    name: "Tech Foundation",
    symbol: "TECH",
    amount: 200,
    logoUrl: "https://picsum.photos/200/200?random=4",
    creatorName: "Tech DAO",
    creatorAddress: "0xyzab...cdef",
    startDate: "2023-11-01T00:00:00Z",
    endDate: "2024-01-01T00:00:00Z",
    claimers: 0,
    totalTokens: 2000000,
    isEligible: false,
    hasClaimed: false,
    description: "Upcoming token for the decentralized tech foundation.",
    type: "ERC20",
    status: "upcoming",
  },
  {
    id: "6",
    name: "Game Credits",
    symbol: "GAME",
    amount: 500,
    logoUrl: "https://picsum.photos/200/200?random=5",
    creatorName: "GameFi Protocol",
    creatorAddress: "0xghij...klmn",
    startDate: "2023-08-01T00:00:00Z",
    endDate: "2023-09-01T00:00:00Z",
    claimers: 1500,
    totalTokens: 750000,
    isEligible: true,
    hasClaimed: true,
    description: "Gaming tokens for the GameFi ecosystem.",
    type: "ERC20",
    status: "completed",
  },
  {
    id: "7",
    name: "Art Collection",
    symbol: "ART",
    amount: 1,
    logoUrl: "https://picsum.photos/200/200?random=6",
    creatorName: "Digital Artists",
    creatorAddress: "0xopqr...stuv",
    startDate: "2023-09-01T00:00:00Z",
    endDate: "2023-10-01T00:00:00Z",
    claimers: 750,
    totalTokens: 1000,
    isEligible: false,
    hasClaimed: false,
    description: "Digital art NFT collection for art enthusiasts.",
    type: "ERC721",
    status: "expired",
  },
  {
    id: "8",
    name: "Finance Protocol",
    symbol: "FIN",
    amount: 150,
    logoUrl: "https://picsum.photos/200/200?random=7",
    creatorName: "DeFi Alliance",
    creatorAddress: "0xwxyz...abcd",
    startDate: "2023-10-15T00:00:00Z",
    endDate: "2023-12-15T00:00:00Z",
    claimers: 350,
    totalTokens: 1500000,
    isEligible: true,
    hasClaimed: false,
    description: "Governance tokens for the Finance Protocol.",
    type: "ERC20",
    status: "active",
  },
];

type FilterOptions = {
  status?: AirdropData['status'];
  type?: AirdropData['type'];
  eligibility?: 'all' | 'eligible' | 'claimed';
};

export default function AirdropExplorer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [airdrops, setAirdrops] = useState<AirdropData[]>(MOCK_ALL_AIRDROPS);
  const [featuredAirdrops, setFeaturedAirdrops] = useState<AirdropData[]>(MOCK_FEATURED_AIRDROPS);
  const [selectedAirdrop, setSelectedAirdrop] = useState<AirdropData | null>(null);

  // In a real implementation, this would fetch data from the blockchain
  useEffect(() => {
    // Mock data fetch
    const fetchAirdrops = async () => {
      try {
        // In a real implementation, this would be a blockchain call
        // const provider = new ethers.providers.Web3Provider(window.ethereum);
        // const contract = new ethers.Contract(airdropFactoryAddress, airdropFactoryABI, provider);
        // const allAirdrops = await contract.getAllAirdrops();
        // const featuredAirdrops = allAirdrops.filter(airdrop => airdrop.isFeatured);
        
        // For now, just use mock data
        setAirdrops(MOCK_ALL_AIRDROPS);
        setFeaturedAirdrops(MOCK_FEATURED_AIRDROPS);
      } catch (error) {
        console.error("Error fetching airdrops:", error);
      }
    };

    fetchAirdrops();
  }, []);

  // Filter and search airdrops
  const filteredAirdrops = airdrops.filter(airdrop => {
    // Search query filter
    const matchesSearch = searchQuery === "" || 
      airdrop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      airdrop.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      airdrop.creatorName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = !filters.status || airdrop.status === filters.status;
    
    // Type filter
    const matchesType = !filters.type || airdrop.type === filters.type;
    
    // Eligibility filter
    let matchesEligibility = true;
    if (filters.eligibility === 'eligible') {
      matchesEligibility = !!airdrop.isEligible && !airdrop.hasClaimed;
    } else if (filters.eligibility === 'claimed') {
      matchesEligibility = !!airdrop.hasClaimed;
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesEligibility;
  });

  const handleClaimAirdrop = async (airdrop: AirdropData) => {
    try {
      // In a real implementation, this would be a blockchain call
      // const provider = new ethers.providers.Web3Provider(window.ethereum);
      // const signer = provider.getSigner();
      // const contract = new ethers.Contract(airdropAddress, airdropABI, signer);
      // const tx = await contract.claim();
      // await tx.wait();
      
      // For now, just simulate success
      console.log(`Claimed ${airdrop.amount} ${airdrop.symbol} tokens from ${airdrop.name}`);
      
      // Update the airdrop in the state to reflect claimed status
      const updateAirdrop = (list: AirdropData[]) => 
        list.map(a => a.id === airdrop.id ? { ...a, hasClaimed: true } : a);
      
      setAirdrops(updateAirdrop);
      setFeaturedAirdrops(updateAirdrop);
      
      // If the claimed airdrop is the selected one, update it as well
      if (selectedAirdrop?.id === airdrop.id) {
        setSelectedAirdrop({ ...selectedAirdrop, hasClaimed: true });
      }
      
      // Show confetti
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);

      return true;
    } catch (error) {
      console.error("Error claiming airdrop:", error);
      return false;
    }
  };

  const handleSelectAirdrop = (airdrop: AirdropData) => {
    setSelectedAirdrop(airdrop);
  };

  const closeDetailView = () => {
    setSelectedAirdrop(null);
  };

  return (
    <div className="relative min-h-screen w-full bg-black">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10 opacity-30">
        <Particles
          className="absolute inset-0"
          quantity={30}
          staticity={40}
          color="#ffffff"
        />
      </div>

      <Confetti trigger={showConfetti} duration={3000} />

      {/* Detailed airdrop view modal */}
      {selectedAirdrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div 
            className="absolute inset-0" 
            onClick={closeDetailView}
          />
          <div className="relative z-10 w-full max-w-2xl animate-fade-in">
            <div className="relative">
              <AirdropCard
                airdrop={selectedAirdrop}
                onClaim={handleClaimAirdrop}
                isDetailed={true}
                isClickable={false}
              />
              <button 
                className="absolute -right-2 -top-2 rounded-full bg-gray-900/80 p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
                onClick={closeDetailView}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-4xl font-bold text-white">Airdrop Explorer</h1>

        {/* Featured Airdrops */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-white">Featured Airdrops</h2>
          <Marquee
            speed={20}
            pauseOnHover={true}
            className="py-2"
            autoFill={false}
          >
            {featuredAirdrops.map((airdrop) => (
              <div key={airdrop.id} className="mx-4 w-[350px]">
                <AirdropCard
                  airdrop={airdrop}
                  onClaim={handleClaimAirdrop}
                  onClick={() => handleSelectAirdrop(airdrop)}
                />
              </div>
            ))}
          </Marquee>
        </div>

        {/* Search and Filters */}
        <GlassmorphismCard className="mb-8 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search airdrops by name, symbol, or creator..."
                className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-10 py-2 text-white placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <motion.button
              className="flex items-center rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2 text-white"
              onClick={() => setShowFilters(!showFilters)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </motion.button>
          </div>

          {/* Filter options */}
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 grid grid-cols-1 gap-4 overflow-hidden rounded-lg border border-gray-700 bg-gray-900/30 p-4 md:grid-cols-3"
            >
              {/* Status filter */}
              <div>
                <label className="mb-2 block text-sm text-gray-300">Status</label>
                <select
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                  value={filters.status || ""}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as AirdropData['status'] || undefined })}
                >
                  <option value="">All Statuses</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Type filter */}
              <div>
                <label className="mb-2 block text-sm text-gray-300">Token Type</label>
                <select
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                  value={filters.type || ""}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value as AirdropData['type'] || undefined })}
                >
                  <option value="">All Types</option>
                  <option value="ERC20">ERC20</option>
                  <option value="ERC721">ERC721</option>
                </select>
              </div>

              {/* Eligibility filter */}
              <div>
                <label className="mb-2 block text-sm text-gray-300">Eligibility</label>
                <select
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                  value={filters.eligibility || "all"}
                  onChange={(e) => setFilters({ ...filters, eligibility: e.target.value as 'all' | 'eligible' | 'claimed' })}
                >
                  <option value="all">All Airdrops</option>
                  <option value="eligible">Eligible to Claim</option>
                  <option value="claimed">Already Claimed</option>
                </select>
              </div>
            </motion.div>
          )}
        </GlassmorphismCard>

        {/* All Airdrops */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">All Airdrops</h2>
            <div className="flex items-center text-sm text-gray-400">
              <Wallet className="mr-1 h-4 w-4" />
              <span>{filteredAirdrops.length} airdrops found</span>
            </div>
          </div>

          {filteredAirdrops.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredAirdrops.map((airdrop) => (
                <AirdropCard
                  key={airdrop.id}
                  airdrop={airdrop}
                  onClaim={handleClaimAirdrop}
                  onClick={() => handleSelectAirdrop(airdrop)}
                />
              ))}
            </div>
          ) : (
            <GlassmorphismCard className="p-8 text-center">
              <div className="mb-4 text-4xl text-gray-400">🔍</div>
              <h3 className="mb-2 text-xl font-medium text-white">No Airdrops Found</h3>
              <p className="text-gray-400">
                Try adjusting your search or filters to find airdrops.
              </p>
            </GlassmorphismCard>
          )}
        </div>
      </div>
    </div>
  );
} 