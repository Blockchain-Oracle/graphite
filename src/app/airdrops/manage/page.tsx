"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  PauseCircle, 
  PlayCircle, 
  Trash2, 
  Edit, 
  ExternalLink, 
  ArrowUpDown, 
  Check, 
  X, 
  ChevronRight, 
  ChartBar, 
  Users, 
  Timer, 
  AlertCircle,
  Gift,
  Clock,
  Calendar 
} from "lucide-react";
import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";
import { AnimatedList } from "@/components/magicui/animated-list";
import { Particles } from "@/components/magicui/particles";
import { AirdropData } from "@/components/web3/airdrop-card";

// Mock data for created airdrops
const MOCK_MY_AIRDROPS: (AirdropData & { 
  claimed: number;
  creationDate: string;
  isPaused?: boolean;
})[] = [
  {
    id: "1",
    name: "Graphite Token",
    symbol: "GRT",
    amount: 100,
    logoUrl: "https://picsum.photos/200/200",
    creatorName: "Me",
    creatorAddress: "0x1234...5678",
    startDate: "2023-10-01T00:00:00Z",
    endDate: "2023-11-01T00:00:00Z",
    claimed: 850,
    claimers: 1250,
    totalTokens: 1000000,
    isPaused: false,
    creationDate: "2023-09-20T00:00:00Z",
    description: "Claim your Graphite governance tokens to participate in protocol decisions.",
    type: "ERC20",
    status: "active",
  },
  {
    id: "2",
    name: "Tech Foundation",
    symbol: "TECH",
    amount: 200,
    logoUrl: "https://picsum.photos/200/200?random=4",
    creatorName: "Me",
    creatorAddress: "0x1234...5678",
    startDate: "2023-11-01T00:00:00Z",
    endDate: "2024-01-01T00:00:00Z",
    claimed: 0,
    claimers: 0,
    totalTokens: 2000000,
    isPaused: false,
    creationDate: "2023-10-15T00:00:00Z",
    description: "Upcoming token for the decentralized tech foundation.",
    type: "ERC20",
    status: "upcoming",
  },
  {
    id: "3",
    name: "Game Credits",
    symbol: "GAME",
    amount: 500,
    logoUrl: "https://picsum.photos/200/200?random=5",
    creatorName: "Me",
    creatorAddress: "0x1234...5678",
    startDate: "2023-08-01T00:00:00Z",
    endDate: "2023-09-01T00:00:00Z",
    claimed: 1500,
    claimers: 1500,
    totalTokens: 750000,
    isPaused: false,
    creationDate: "2023-07-15T00:00:00Z",
    description: "Gaming tokens for the GameFi ecosystem.",
    type: "ERC20",
    status: "completed",
  },
  {
    id: "4",
    name: "Art Collection",
    symbol: "ART",
    amount: 1,
    logoUrl: "https://picsum.photos/200/200?random=6",
    creatorName: "Me",
    creatorAddress: "0x1234...5678",
    startDate: "2023-09-01T00:00:00Z",
    endDate: "2023-10-01T00:00:00Z",
    claimed: 320,
    claimers: 750,
    totalTokens: 1000,
    isPaused: true,
    creationDate: "2023-08-15T00:00:00Z",
    description: "Digital art NFT collection for art enthusiasts.",
    type: "ERC721",
    status: "expired",
  },
];

// Mock recent activities
const MOCK_RECENT_ACTIVITIES = [
  { 
    id: 1, 
    type: "claim", 
    airdropId: "1", 
    airdropName: "Graphite Token",
    address: "0xabcd...1234", 
    date: "2023-10-20T15:30:00Z", 
  },
  { 
    id: 2, 
    type: "claim", 
    airdropId: "1", 
    airdropName: "Graphite Token",
    address: "0xefgh...5678", 
    date: "2023-10-20T15:25:00Z", 
  },
  { 
    id: 3, 
    type: "pause", 
    airdropId: "4", 
    airdropName: "Art Collection",
    date: "2023-10-20T14:15:00Z", 
  },
  { 
    id: 4, 
    type: "create", 
    airdropId: "2", 
    airdropName: "Tech Foundation",
    date: "2023-10-15T10:30:00Z", 
  },
];

export default function ManageAirdrops() {
  const [airdrops, setAirdrops] = useState(MOCK_MY_AIRDROPS);
  const [sortField, setSortField] = useState<string>("creationDate");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [activities, setActivities] = useState(MOCK_RECENT_ACTIVITIES);
  const [selectedAirdrop, setSelectedAirdrop] = useState<string | null>(null);

  // In a real implementation, this would fetch data from the blockchain
  useEffect(() => {
    // Mock data fetch
    const fetchAirdrops = async () => {
      try {
        // In a real implementation, this would be a blockchain call
        // const provider = new ethers.providers.Web3Provider(window.ethereum);
        // const signer = provider.getSigner();
        // const contract = new ethers.Contract(airdropFactoryAddress, airdropFactoryABI, signer);
        // const myAirdrops = await contract.getMyAirdrops();
        
        // For now, just use mock data
        setAirdrops(MOCK_MY_AIRDROPS);
        setActivities(MOCK_RECENT_ACTIVITIES);
      } catch (error) {
        console.error("Error fetching airdrops:", error);
      }
    };

    fetchAirdrops();
  }, []);

  // Sort airdrops based on selected field and direction
  const sortedAirdrops = [...airdrops].sort((a, b) => {
    let aValue = a[sortField as keyof typeof a];
    let bValue = b[sortField as keyof typeof b];
    
    // Handle date fields
    if (sortField.includes('Date')) {
      aValue = new Date(aValue as string).getTime();
      bValue = new Date(bValue as string).getTime();
    }
    
    // Handle numeric fields
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    // Handle string fields
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    
    return 0;
  });

  // Toggle sort direction or change sort field
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Toggle pause/unpause airdrop
  const handleTogglePause = (id: string) => {
    setAirdrops(prevAirdrops => 
      prevAirdrops.map(airdrop => 
        airdrop.id === id
          ? { ...airdrop, isPaused: !airdrop.isPaused }
          : airdrop
      )
    );
  };

  // Format date to readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  // Format date time to readable string
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Calculate total statistics
  const totalStats = {
    activeAirdrops: airdrops.filter(a => a.status === 'active').length,
    totalClaimed: airdrops.reduce((sum, airdrop) => sum + airdrop.claimed, 0),
    totalClaimers: airdrops.reduce((sum, airdrop) => sum + airdrop.claimers, 0),
    completionRate: Math.round(
      (airdrops.reduce((sum, airdrop) => sum + airdrop.claimed, 0) / 
       airdrops.reduce((sum, airdrop) => sum + airdrop.claimers, 0)) * 100
    ) || 0,
  };

  // Get details for a specific airdrop
  const getAirdropDetails = (id: string) => {
    return airdrops.find(airdrop => airdrop.id === id);
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

      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-4xl font-bold text-white">Manage Airdrops</h1>

        {/* Statistics Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <GlassmorphismCard className="p-4">
            <div className="flex items-center">
              <div className="mr-3 rounded-full bg-blue-900/30 p-3">
                <Gift className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Active Airdrops</p>
                <h3 className="text-2xl font-bold text-white">{totalStats.activeAirdrops}</h3>
              </div>
            </div>
          </GlassmorphismCard>

          <GlassmorphismCard className="p-4">
            <div className="flex items-center">
              <div className="mr-3 rounded-full bg-green-900/30 p-3">
                <Users className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Claimers</p>
                <h3 className="text-2xl font-bold text-white">{totalStats.totalClaimers}</h3>
              </div>
            </div>
          </GlassmorphismCard>

          <GlassmorphismCard className="p-4">
            <div className="flex items-center">
              <div className="mr-3 rounded-full bg-purple-900/30 p-3">
                <ChartBar className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Claimed</p>
                <h3 className="text-2xl font-bold text-white">{totalStats.totalClaimed}</h3>
              </div>
            </div>
          </GlassmorphismCard>

          <GlassmorphismCard className="p-4">
            <div className="flex items-center">
              <div className="mr-3 rounded-full bg-amber-900/30 p-3">
                <Timer className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Completion Rate</p>
                <h3 className="text-2xl font-bold text-white">{totalStats.completionRate}%</h3>
              </div>
            </div>
          </GlassmorphismCard>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Airdrops Table */}
          <div className="lg:col-span-2">
            <GlassmorphismCard className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700 bg-gray-900/50 text-left">
                      <th 
                        className="cursor-pointer p-4 text-sm font-medium text-gray-300 hover:text-white"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center">
                          Name
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </div>
                      </th>
                      <th 
                        className="cursor-pointer p-4 text-sm font-medium text-gray-300 hover:text-white"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center">
                          Status
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </div>
                      </th>
                      <th 
                        className="cursor-pointer p-4 text-sm font-medium text-gray-300 hover:text-white"
                        onClick={() => handleSort('claimed')}
                      >
                        <div className="flex items-center">
                          Claimed
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </div>
                      </th>
                      <th 
                        className="cursor-pointer p-4 text-sm font-medium text-gray-300 hover:text-white"
                        onClick={() => handleSort('endDate')}
                      >
                        <div className="flex items-center">
                          End Date
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </div>
                      </th>
                      <th className="p-4 text-sm font-medium text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAirdrops.map((airdrop) => (
                      <tr 
                        key={airdrop.id} 
                        className="border-b border-gray-700 hover:bg-gray-900/30"
                        onClick={() => setSelectedAirdrop(airdrop.id)}
                      >
                        <td className="p-4">
                          <div className="flex items-center">
                            <div className="mr-3 h-8 w-8 overflow-hidden rounded-full">
                              <img
                                src={airdrop.logoUrl}
                                alt={airdrop.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-medium text-white">{airdrop.name}</div>
                              <div className="text-xs text-gray-400">{airdrop.symbol}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          {airdrop.isPaused ? (
                            <div className="flex items-center rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-400">
                              <PauseCircle className="mr-1 h-3 w-3" />
                              Paused
                            </div>
                          ) : (
                            <div className={`flex items-center rounded-full px-2 py-1 text-xs ${
                              airdrop.status === 'active'
                                ? 'bg-green-500/10 text-green-400'
                                : airdrop.status === 'upcoming'
                                ? 'bg-blue-500/10 text-blue-400'
                                : airdrop.status === 'expired'
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-gray-500/10 text-gray-400'
                            }`}>
                              {airdrop.status === 'active' && <Check className="mr-1 h-3 w-3" />}
                              {airdrop.status === 'upcoming' && <Clock className="mr-1 h-3 w-3" />}
                              {airdrop.status === 'expired' && <AlertCircle className="mr-1 h-3 w-3" />}
                              {airdrop.status === 'completed' && <Check className="mr-1 h-3 w-3" />}
                              <span className="capitalize">{airdrop.status}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="text-white">
                            {airdrop.claimed} / {airdrop.claimers}
                          </div>
                          <div className="mt-1 h-1 w-full rounded-full bg-gray-700">
                            <div 
                              className="h-1 rounded-full bg-blue-500" 
                              style={{ width: `${(airdrop.claimed / airdrop.claimers) * 100}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-300">
                          {formatDate(airdrop.endDate)}
                        </td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="rounded-md p-1 text-blue-400 hover:bg-blue-900/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Redirect to edit page in a real implementation
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className={`rounded-md p-1 ${
                                airdrop.isPaused ? 'text-green-400 hover:bg-green-900/20' : 'text-amber-400 hover:bg-amber-900/20'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePause(airdrop.id);
                              }}
                            >
                              {airdrop.isPaused ? (
                                <PlayCircle className="h-4 w-4" />
                              ) : (
                                <PauseCircle className="h-4 w-4" />
                              )}
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="rounded-md p-1 text-red-400 hover:bg-red-900/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Delete airdrop in a real implementation
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </motion.button>

                            <motion.a
                              href={`/airdrops/explore?id=${airdrop.id}`}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="rounded-md p-1 text-gray-400 hover:bg-gray-900/20"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </motion.a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* No airdrops message */}
              {airdrops.length === 0 && (
                <div className="p-6 text-center">
                  <div className="mb-4 text-4xl text-gray-400">🎁</div>
                  <h3 className="mb-2 text-xl font-medium text-white">No Airdrops Created</h3>
                  <p className="mb-6 text-gray-400">
                    You haven't created any airdrops yet.
                  </p>
                  <motion.a
                    href="/airdrops/create"
                    className="inline-flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-white shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Create Airdrop
                  </motion.a>
                </div>
              )}
            </GlassmorphismCard>
          </div>

          {/* Airdrop Details & Recent Activity */}
          <div className="space-y-6">
            {/* Airdrop Details Panel */}
            <GlassmorphismCard className="p-5">
              <h3 className="mb-4 text-lg font-semibold text-white">
                {selectedAirdrop 
                  ? `${getAirdropDetails(selectedAirdrop)?.name} Details`
                  : "Airdrop Details"
                }
              </h3>

              {selectedAirdrop ? (
                <div className="space-y-4">
                  {/* Airdrop Info */}
                  {(() => {
                    const airdrop = getAirdropDetails(selectedAirdrop);
                    if (!airdrop) return null;

                    return (
                      <>
                        <div className="flex flex-col items-center">
                          <div className="mb-3 h-16 w-16 overflow-hidden rounded-full">
                            <img
                              src={airdrop.logoUrl}
                              alt={airdrop.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <h4 className="mb-1 text-xl font-bold text-white">{airdrop.name}</h4>
                          <p className="text-gray-400">{airdrop.symbol} • {airdrop.type}</p>
                        </div>

                        <div className="rounded-lg bg-gray-900/30 p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm text-gray-400">Claiming Progress</span>
                            <span className="text-sm font-medium text-white">
                              {Math.round((airdrop.claimed / airdrop.claimers) * 100)}%
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-gray-700">
                            <div 
                              className="h-2 rounded-full bg-blue-500" 
                              style={{ width: `${(airdrop.claimed / airdrop.claimers) * 100}%` }}
                            ></div>
                          </div>
                          <div className="mt-1 flex justify-between text-xs text-gray-500">
                            <span>{airdrop.claimed} claimed</span>
                            <span>{airdrop.claimers} total</span>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Created On:</span>
                            <span className="text-white">{formatDate(airdrop.creationDate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Start Date:</span>
                            <span className="text-white">{formatDate(airdrop.startDate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">End Date:</span>
                            <span className="text-white">{formatDate(airdrop.endDate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Amount Per Wallet:</span>
                            <span className="text-white">{airdrop.amount} {airdrop.symbol}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Total Tokens:</span>
                            <span className="text-white">{airdrop.totalTokens.toLocaleString()} {airdrop.symbol}</span>
                          </div>
                        </div>

                        <div className="flex justify-between space-x-2">
                          <motion.button
                            className={`flex flex-1 items-center justify-center rounded-lg ${
                              airdrop.isPaused 
                                ? "bg-green-500/10 text-green-400" 
                                : "bg-amber-500/10 text-amber-400"
                            } px-3 py-2`}
                            onClick={() => handleTogglePause(airdrop.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {airdrop.isPaused ? (
                              <>
                                <PlayCircle className="mr-2 h-4 w-4" />
                                Resume
                              </>
                            ) : (
                              <>
                                <PauseCircle className="mr-2 h-4 w-4" />
                                Pause
                              </>
                            )}
                          </motion.button>

                          <motion.button
                            className="flex flex-1 items-center justify-center rounded-lg bg-blue-500/10 px-3 py-2 text-blue-400"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </motion.button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="flex h-[300px] flex-col items-center justify-center text-center">
                  <div className="mb-2 rounded-full bg-gray-800 p-4">
                    <Gift className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400">Select an airdrop to view details</p>
                </div>
              )}
            </GlassmorphismCard>

            {/* Recent Activity */}
            <GlassmorphismCard className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                <motion.a
                  href="#"
                  className="flex items-center text-sm text-blue-400"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View All <ChevronRight className="ml-1 h-4 w-4" />
                </motion.a>
              </div>

              <div className="mt-4">
                <AnimatedList
                  items={activities}
                  keyExtractor={(item) => item.id}
                  itemClassName="mb-3"
                  staggerDelay={0.1}
                  renderItem={(activity) => (
                    <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-3">
                      <div className="flex items-center">
                        <div className={`mr-3 rounded-full p-2 ${
                          activity.type === 'claim' 
                            ? 'bg-green-900/30' 
                            : activity.type === 'pause'
                            ? 'bg-amber-900/30'
                            : 'bg-blue-900/30'
                        }`}>
                          {activity.type === 'claim' && <Check className="h-4 w-4 text-green-400" />}
                          {activity.type === 'pause' && <PauseCircle className="h-4 w-4 text-amber-400" />}
                          {activity.type === 'create' && <Gift className="h-4 w-4 text-blue-400" />}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white">
                            {activity.type === 'claim' && `Claimed ${getAirdropDetails(activity.airdropId)?.symbol || ''}`}
                            {activity.type === 'pause' && `Paused ${activity.airdropName}`}
                            {activity.type === 'create' && `Created ${activity.airdropName}`}
                          </div>
                          <div className="text-xs text-gray-400">
                            {activity.type === 'claim' && `By ${activity.address}`}
                            {formatDateTime(activity.date)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                />
              </div>
            </GlassmorphismCard>
          </div>
        </div>
      </div>
    </div>
  );
} 