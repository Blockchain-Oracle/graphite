"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Search, Filter, Wallet, X } from "lucide-react";
import { AirdropCard, AirdropData } from "@/components/web3/airdrop-card";
import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";
import { Marquee } from "@/components/magicui/marquee";
import { Particles } from "@/components/magicui/particles";
import { Confetti } from "@/components/magicui/confetti";
import { useUserAirdrops } from "@/lib/hooks/useAirdrops";
import { useAccount } from "wagmi";

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
  
  const { 
    allAirdrops: rawAirdrops, 
    isLoading: isLoadingAirdrops, 
    error: airdropsError 
  } = useUserAirdrops();

  const [allAirdropsData, setAllAirdropsData] = useState<AirdropData[]>([]);
  const [featuredAirdrops, setFeaturedAirdrops] = useState<AirdropData[]>([]);
  const [selectedAirdrop, setSelectedAirdrop] = useState<AirdropData | null>(null);

  const { address: currentUserAddress } = useAccount();

  useEffect(() => {
    if (rawAirdrops) {
      setAllAirdropsData(rawAirdrops);
      const activeAirdrops = rawAirdrops.filter(a => a.status === 'active');
      setFeaturedAirdrops(activeAirdrops.slice(0, Math.min(5, activeAirdrops.length)));
    }
  }, [rawAirdrops]);

  const filteredAirdrops = allAirdropsData.filter(airdrop => {
    const matchesSearch = searchQuery === "" || 
      airdrop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (airdrop.symbol && airdrop.symbol.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (airdrop.creatorName && airdrop.creatorName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = !filters.status || airdrop.status === filters.status;
    
    const matchesType = !filters.type || airdrop.type === filters.type;
    
    let matchesEligibility = true;
    if (filters.eligibility === 'eligible') {
      matchesEligibility = !!airdrop.isEligible && !airdrop.hasClaimed;
    } else if (filters.eligibility === 'claimed') {
      matchesEligibility = !!airdrop.hasClaimed;
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesEligibility;
  });

  const handleClaimAirdrop = async (claimedAirdrop: AirdropData): Promise<boolean> => {
    try {
      console.log(`Airdrop claim reported for ${claimedAirdrop.name} by AirdropCard.`);
      
      const updateAirdropList = (list: AirdropData[]) => 
        list.map(a => a.id === claimedAirdrop.id ? { ...a, hasClaimed: true, isEligible: false } : a);
      
      setAllAirdropsData(updateAirdropList);
      
      if (selectedAirdrop?.id === claimedAirdrop.id) {
        setSelectedAirdrop(prev => prev ? { ...prev, hasClaimed: true, isEligible: false } : null);
      }
      
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);

      return true;
    } catch (error) {
      console.error("Error in UI update after claiming airdrop:", error);
      return false;
    }
  };

  const handleSelectAirdrop = (airdrop: AirdropData) => {
    setSelectedAirdrop(airdrop);
  };

  const closeDetailView = () => {
    setSelectedAirdrop(null);
  };

  if (isLoadingAirdrops) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center bg-black text-white">
        Loading airdrops...
      </div>
    );
  }

  if (airdropsError) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center bg-black text-red-500">
        Error loading airdrops: {airdropsError.message}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-black">
      <div className="fixed inset-0 -z-10 opacity-30">
        <Particles
          className="absolute inset-0"
          quantity={30}
          staticity={40}
          color="#ffffff"
        />
      </div>

      <Confetti trigger={showConfetti} duration={3000} />

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

        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-white">Featured Airdrops</h2>
          <Marquee
            speed={20}
            pauseOnHover={true}
            className="py-2"
            autoFill={featuredAirdrops.length < 3}
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

          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 grid grid-cols-1 gap-4 overflow-hidden rounded-lg border border-gray-700 bg-gray-900/30 p-4 md:grid-cols-3"
            >
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
                {rawAirdrops && rawAirdrops.length > 0 ? "Try adjusting your search or filters." : "There are currently no airdrops available."}
              </p>
            </GlassmorphismCard>
          )}
        </div>
      </div>
    </div>
  );
} 