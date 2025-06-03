"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import { 
  ArrowLeft, ArrowRight, CheckCircle, AlertCircle, Info, Upload, Clock, 
  Calendar, FileText, Users, Settings, Eye, Gift, Loader2, FileUp 
} from "lucide-react";
import { GlassmorphismCard } from "@/components/ui/glassmorphism-card";
import { AnimatedBeamsContainer } from "@/components/magicui/animated-beam";
import { CoolMode } from "@/components/magicui/cool-mode";
import { Particles } from "@/components/magicui/particles";
import { Confetti } from "@/components/magicui/confetti";
import { ShineBorderCard } from "@/components/magicui/shine-border";
import { Button } from "@/components/ui/button";
import dynamic from 'next/dynamic';
import { 
  useTokenMetadata, 
  useTokenAllowance, 
  useCreateAirdrop, 
  useMerkleTree, 
  type AirdropRecipient, 
  type MerkleProofData 
} from "@/lib/hooks/useAirdrops";
import { getContractConfig } from "@/lib/web3/contract-config";
import { useAccount } from "wagmi";
import { isAddress } from "viem";

// Define the shape for a column in the CSVImporter template
interface CSVColumn {
  name: string; // This is the display name for the column (header)
  key: string;  // This is the key used in the resulting data objects
  required?: boolean;
  description?: string;
  suggested_mappings?: string[];
  data_type?: 'string' | 'number' | 'boolean'; // Based on typical CSV data
}

// Dynamically import CSVImporter to ensure it only runs on the client-side
const CSVImporter = dynamic(() => 
  import('csv-import-react').then(mod => mod.CSVImporter),
  { ssr: false }
);

type AirdropFormData = {
  tokenDetails: {
    tokenType: "ERC20" | "ERC721"; // ERC721 might need different amount handling
    tokenAddress: string;
    tokenName: string;
    tokenSymbol: string;
    // tokenAmount: string; // Amount per wallet - will be derived from CSV for Merkle, or set for non-Merkle
    logoUrl: string;
  };
  distribution: {
    recipientAddresses: string[]; // Kept for non-merkle or as summary
    hasMerkleTree: boolean;
    merkleRoot?: string;
  };
  eligibility: {
    requireKYC: boolean;
    requireTrustScore: boolean;
    minimumTrustScore?: number;
    allowedRegions?: string[];
  };
  timing: {
    startDate: string;
    endDate: string;
    claimDeadline?: string;
  };
};

const initialFormData: AirdropFormData = {
  tokenDetails: {
    tokenType: "ERC20",
    tokenAddress: "",
    tokenName: "",
    tokenSymbol: "",
    // tokenAmount: "", 
    logoUrl: "",
  },
  distribution: {
    recipientAddresses: [],
    hasMerkleTree: false,
  },
  eligibility: {
    requireKYC: false,
    requireTrustScore: false,
  },
  timing: {
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  },
};

const steps = [
  { id: "token-selection", title: "Token Selection", icon: Gift },
  { id: "distribution", title: "Distribution List", icon: Users },
  { id: "eligibility", title: "Eligibility", icon: Settings },
  { id: "timing", title: "Timing", icon: Calendar },
  { id: "review", title: "Review & Approve", icon: Eye },
];

// Adapted for csv-import-react template structure
const csvImportColumns: CSVColumn[] = [
  { 
    name: "Wallet Address", 
    key: "address", 
    required: true, 
    description: "The recipient\'s wallet address (e.g., 0x...)",
    suggested_mappings: ["wallet", "address", "recipient_address", "wallet address"]
  },
  { 
    name: "Token Amount", 
    key: "amount", 
    required: true, 
    description: "Amount in the smallest unit (e.g., wei)", 
    data_type: "string", // Keep as string for BigInt conversion
    suggested_mappings: ["amount", "token_amount", "value", "token amount"]
  },
];

export default function CreateAirdrop() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<AirdropFormData>(initialFormData);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isCsvImporterOpen, setIsCsvImporterOpen] = useState(false);
  const [parsedRecipients, setParsedRecipients] = useState<AirdropRecipient[]>([]);
  const [totalTokensToAirdrop, setTotalTokensToAirdrop] = useState<bigint>(BigInt(0));
  const [merkleRootDisplay, setMerkleRootDisplay] = useState<string>("");

  const { address: userWalletAddress } = useAccount();
  const airdropFactoryAddress = getContractConfig('airdropFactory').address;

  // Token Metadata Hook
  const { 
    tokenInfo: tokenMetadataInfo, 
    isLoading: isTokenMetadataLoading, 
    error: tokenMetadataError,
    formatTokenAmount
  } = useTokenMetadata(
    formData.tokenDetails.tokenAddress as `0x\${string}` // Corrected type cast
  );

  // Token Allowance Hook
  const { 
    allowance, 
    hasSufficientAllowance, 
    isLoading: isAllowanceLoading, 
    error: allowanceError, 
    approveTokens,
    isApprovePending,
    isApproveConfirming,
    isApproveSuccess,
    approveHash
  } = useTokenAllowance(
    formData.tokenDetails.tokenAddress as `0x\${string}`, // Corrected type cast
    totalTokensToAirdrop
  );

  // Create Airdrop Hook
  const { 
    createAirdrop, 
    isPending: isCreatingAirdrop, 
    isConfirming: isCreateAirdropConfirming, 
    isSuccess: isCreateAirdropSuccess, 
    hash: createAirdropHash,
    error: createAirdropError 
  } = useCreateAirdrop();

  // Merkle Tree Hook
  const { 
    generateMerkleTree, 
    isGenerating: isGeneratingMerkle, 
    error: merkleGenerationError, 
    merkleData: merkleTreeHookData 
  } = useMerkleTree();

  // Effect to update token name and symbol from metadata
  useEffect(() => {
    if (tokenMetadataInfo) {
      handleChange("tokenDetails", "tokenName", tokenMetadataInfo.name);
      handleChange("tokenDetails", "tokenSymbol", tokenMetadataInfo.symbol);
      if(tokenMetadataInfo.logo) {
         handleChange("tokenDetails", "logoUrl", tokenMetadataInfo.logo);
      }
    }
  }, [tokenMetadataInfo]);
  
  // Effect to calculate total tokens to airdrop from parsed recipients
  useEffect(() => {
    if (parsedRecipients.length > 0) {
      const newTotal = parsedRecipients.reduce((sum, recipient) => sum + recipient.amount, BigInt(0));
      setTotalTokensToAirdrop(newTotal);
      // Update formData.distribution.recipientAddresses to store just the count for display
      handleChange("distribution", "recipientAddresses", parsedRecipients.map(r => r.address));
    } else {
      setTotalTokensToAirdrop(BigInt(0));
      handleChange("distribution", "recipientAddresses", []);
    }
  }, [parsedRecipients]);


  // Handle form input changes
  const handleChange = (
    section: keyof AirdropFormData,
    field: string,
    value: any
  ) => {
    setFormData((prevData) => ({
      ...prevData,
      [section]: {
        ...prevData[section],
        [field]: value,
      },
    }));
  };

  // Handle file upload for token logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          handleChange("tokenDetails", "logoUrl", event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle CSV import completion
  const handleCsvImportComplete = async (data: {rows: Array<Record<string, any>>}) => {
    console.log("CSV Import Data Received:", JSON.stringify(data, null, 2));

    const importedRows = data.rows || []; 
    console.log("Imported Rows:", JSON.stringify(importedRows, null, 2));

    const recipients: AirdropRecipient[] = importedRows
      .filter(row => {
        // Access data from row.values
        const addressValue = row?.values?.address;
        const amountValue = row?.values?.amount;
        const isValid = row?.values && typeof addressValue === 'string' && addressValue.startsWith('0x') && amountValue && isAddress(addressValue);
        
        if (!isValid && row?.values) {
          console.warn(`Invalid row skipped: Address: ${addressValue}, Amount: ${amountValue}, isAddress valid: ${isAddress(addressValue || '')}`);
        }
        return isValid;
      })
      .map(row => {
        try {
          // Access data from row.values
          const recipientEntry = {
            address: row.values.address as `0x${string}`,
            amount: BigInt(String(row.values.amount)) // Ensure your CSV has full numbers, not scientific notation
          };
          return recipientEntry;
        } catch (e) {
          console.error(`Error converting row to AirdropRecipient: ${JSON.stringify(row.values)}, Error: ${e}`);
          return null;
        }
      })
      .filter(Boolean) as AirdropRecipient[]; // Filter out nulls from mapping errors

    console.log("Parsed Recipients:", JSON.stringify(recipients, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2));
    console.log("Number of Parsed Recipients:", recipients.length);

    setParsedRecipients(recipients);
    setIsCsvImporterOpen(false);

    console.log("Has Merkle Tree Checkbox: ", formData.distribution.hasMerkleTree);

    if (formData.distribution.hasMerkleTree && recipients.length > 0) {
      console.log("Attempting to generate Merkle tree...");
      try {
        const generatedMerkleData = await generateMerkleTree(recipients);
        if (generatedMerkleData) {
          console.log("Merkle Data Generated:", JSON.stringify(generatedMerkleData, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2));
          setMerkleRootDisplay(generatedMerkleData.root);
          handleChange("distribution", "merkleRoot", generatedMerkleData.root);
        } else {
          console.warn("Merkle tree generation returned null or undefined.");
        }
      } catch (err) {
        console.error("Merkle tree generation error:", err);
        // Display error to user
      }
    } else {
      if (!formData.distribution.hasMerkleTree) {
        console.log("Merkle tree not enabled.");
      }
      if (recipients.length === 0) {
        console.log("No valid recipients to generate Merkle tree for.");
      }
    }
  };
  
  const handleApprove = async () => {
    if (!formData.tokenDetails.tokenAddress || totalTokensToAirdrop === BigInt(0)) return;
    try {
      await approveTokens(totalTokensToAirdrop);
    } catch (err) {
      console.error("Error approving tokens:", err);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!userWalletAddress || !formData.tokenDetails.tokenAddress || !tokenMetadataInfo) {
      alert("Please connect your wallet and fill in all required token details.");
      return;
    }

    if (formData.distribution.hasMerkleTree && (!merkleRootDisplay || parsedRecipients.length === 0)) {
        alert("Merkle tree is enabled, but no recipients loaded or Merkle root not generated. Please upload a recipient list.");
        return;
    }
    
    if (!formData.distribution.hasMerkleTree && parsedRecipients.length === 0) {
        alert("Please provide a list of recipient addresses and amounts (e.g., via CSV upload).");
        return;
    }

    const finalMerkleRoot = formData.distribution.hasMerkleTree && merkleRootDisplay
        ? (merkleRootDisplay as `0x${string}`)
        : '0x0000000000000000000000000000000000000000000000000000000000000000';

    const requiredTrustScore = formData.eligibility.requireTrustScore && formData.eligibility.minimumTrustScore
        ? BigInt(formData.eligibility.minimumTrustScore)
        : BigInt(0);

    const requiredKYCLevel = formData.eligibility.requireKYC
        ? BigInt(1) // Default to KYC Level 1 if required
        : BigInt(0);

    try {
      await createAirdrop(
        formData.tokenDetails.tokenAddress as `0x${string}`,
        finalMerkleRoot,
        requiredTrustScore,
        requiredKYCLevel,
        BigInt(Math.floor(new Date(formData.timing.startDate).getTime() / 1000)),
        BigInt(Math.floor(new Date(formData.timing.endDate).getTime() / 1000))
      );
      // Success is handled by useEffect watching isCreateAirdropSuccess
    } catch (error) {
      console.error("Error creating airdrop:", error);
      // Error state is already handled by useCreateAirdrop hook
    }
  };
  
  // Handle success state for airdrop creation
  useEffect(() => {
    if (isCreateAirdropSuccess) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [isCreateAirdropSuccess]);

  const isNextDisabled = useMemo(() => {
    if (currentStep === 0) { // Token Selection
      return !formData.tokenDetails.tokenAddress || !tokenMetadataInfo || isTokenMetadataLoading;
    }
    if (currentStep === 1) { // Distribution
       if (formData.distribution.hasMerkleTree) {
         return parsedRecipients.length === 0 || !merkleRootDisplay || isGeneratingMerkle;
       }
       // For non-merkle, a simple check if addresses are added and amount per wallet is set
       // This part needs adjustment if we allow direct input for non-merkle airdrops
       return parsedRecipients.length === 0;
    }
    // Add more specific validations for other steps if needed
    return false;
  }, [currentStep, formData, tokenMetadataInfo, isTokenMetadataLoading, parsedRecipients, merkleRootDisplay, isGeneratingMerkle]);


  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Token Selection
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-gray-300">Token Type</label>
                <select
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                  value={formData.tokenDetails.tokenType}
                  onChange={(e) => handleChange("tokenDetails", "tokenType", e.target.value)}
                >
                  <option value="ERC20">ERC20 Token</option>
                  {/* <option value="ERC721">ERC721 NFT</option> */}
                </select>
              </div>
              
              <div>
                <label className="mb-2 block text-sm text-gray-300">Token Contract Address</label>
                <input
                  type="text"
                  placeholder="0x..."
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                  value={formData.tokenDetails.tokenAddress}
                  onChange={(e) => handleChange("tokenDetails", "tokenAddress", e.target.value)}
                />
                 {isTokenMetadataLoading && <p className="mt-1 text-sm text-blue-400">Fetching token info...</p>}
                 {tokenMetadataError && <p className="mt-1 text-sm text-red-400">Error: {tokenMetadataError.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-gray-300">Token Name</label>
                <input
                  type="text"
                  placeholder={tokenMetadataInfo ? tokenMetadataInfo.name : "Token Name"}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                  value={formData.tokenDetails.tokenName}
                  onChange={(e) => handleChange("tokenDetails", "tokenName", e.target.value)}
                  readOnly={!!tokenMetadataInfo?.name}
                />
              </div>
              
              <div>
                <label className="mb-2 block text-sm text-gray-300">Token Symbol</label>
                <input
                  type="text"
                  placeholder={tokenMetadataInfo ? tokenMetadataInfo.symbol : "SYMBOL"}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                  value={formData.tokenDetails.tokenSymbol}
                  onChange={(e) => handleChange("tokenDetails", "tokenSymbol", e.target.value)}
                  readOnly={!!tokenMetadataInfo?.symbol}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Removed Amount Per Wallet input as it's derived from CSV or handled differently for non-merkle */}
              <div>
                 {tokenMetadataInfo && (
                    <p className="text-sm text-gray-400">Decimals: {tokenMetadataInfo.decimals}</p>
                 )}
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-300">Token Logo</label>
                <div className="flex items-center">
                  <label className="flex w-full cursor-pointer items-center rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white">
                    <Upload className="mr-2 h-4 w-4" />
                    <span className="text-sm">
                      {formData.tokenDetails.logoUrl ? "Change Logo" : "Upload Logo"}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 1: // Distribution List
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="merkle-tree"
                  className="mr-2 h-4 w-4"
                  checked={formData.distribution.hasMerkleTree}
                  onChange={(e) => {
                      handleChange("distribution", "hasMerkleTree", e.target.checked);
                      if (!e.target.checked) { // If unchecking, clear Merkle related data
                          setParsedRecipients([]);
                          setMerkleRootDisplay("");
                          handleChange("distribution", "merkleRoot", undefined);
                      }
                  }}
                />
                <label htmlFor="merkle-tree" className="text-sm text-gray-300">
                  Use Merkle Tree for gas-efficient claims (Recommended for many recipients)
                </label>
              </div>

              {formData.distribution.hasMerkleTree ? (
                <>
                  <Button onClick={() => setIsCsvImporterOpen(true)} className="mb-4 w-full">
                    <FileUp className="mr-2 h-4 w-4" /> Upload Recipients CSV (address, amount)
                  </Button>
                  {parsedRecipients.length > 0 && (
                    <p className="mt-1 text-sm text-gray-400">
                      {parsedRecipients.length} recipients loaded. Total: {tokenMetadataInfo ? formatTokenAmount(totalTokensToAirdrop) : totalTokensToAirdrop.toString()} {formData.tokenDetails.tokenSymbol || 'Tokens'}
                    </p>
                  )}
                  {isGeneratingMerkle && <p className="mt-1 text-sm text-blue-400">Generating Merkle root...</p>}
                  {merkleGenerationError && <p className="mt-1 text-sm text-red-400">Error: {merkleGenerationError.message}</p>}
                  {merkleRootDisplay && (
                    <div>
                      <label className="mb-2 block text-sm text-gray-300">Generated Merkle Root</label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                        value={merkleRootDisplay}
                        readOnly
                      />
                    </div>
                  )}
                </>
              ) : (
                // Fallback for non-Merkle tree (e.g., direct address input or smaller scale)
                // This section needs to be designed based on how non-Merkle airdrops are handled.
                // For now, also using CSV upload, but without Merkle tree generation.
                // Or a simple textarea for addresses, and a single amount per wallet field (re-add from initial).
                <>
                 <Button onClick={() => setIsCsvImporterOpen(true)} className="mb-4 w-full">
                    <FileUp className="mr-2 h-4 w-4" /> Upload Recipients CSV (address, amount)
                  </Button>
                  {parsedRecipients.length > 0 && (
                    <p className="mt-1 text-sm text-gray-400">
                      {parsedRecipients.length} recipients loaded. Total: {tokenMetadataInfo ? formatTokenAmount(totalTokensToAirdrop) : totalTokensToAirdrop.toString()} {formData.tokenDetails.tokenSymbol || 'Tokens'}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">If not using a Merkle tree, ensure the contract can handle direct distributions or a pull-based system for this number of recipients.</p>
                </>
              )}
            </div>
            <CSVImporter
              modalIsOpen={isCsvImporterOpen}
              modalOnCloseTriggered={() => setIsCsvImporterOpen(false)}
              template={{ columns: csvImportColumns } as any} // Added 'as any' to bypass potential strict type mismatches with dynamic import
              onComplete={handleCsvImportComplete}
              darkMode={true}
            />
          </div>
        );

      case 2: // Eligibility
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="require-kyc"
                  className="mr-2 h-4 w-4"
                  checked={formData.eligibility.requireKYC}
                  onChange={(e) => handleChange("eligibility", "requireKYC", e.target.checked)}
                />
                <label htmlFor="require-kyc" className="text-sm text-gray-300">
                  Require KYC Verification
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Only allow KYC verified users to claim this airdrop.
              </p>
            </div>

            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="require-trust"
                  className="mr-2 h-4 w-4"
                  checked={formData.eligibility.requireTrustScore}
                  onChange={(e) => handleChange("eligibility", "requireTrustScore", e.target.checked)}
                />
                <label htmlFor="require-trust" className="text-sm text-gray-300">
                  Require Minimum Trust Score
                </label>
              </div>
            </div>

            {formData.eligibility.requireTrustScore && (
              <div>
                <label className="mb-2 block text-sm text-gray-300">Minimum Trust Score (0-1000)</label>
                <input
                  type="number"
                  placeholder="500"
                  min="0"
                  max="1000"
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                  value={formData.eligibility.minimumTrustScore || ""}
                  onChange={(e) => handleChange("eligibility", "minimumTrustScore", parseInt(e.target.value))}
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm text-gray-300">Allowed Regions (Optional)</label>
              <input
                type="text"
                placeholder="US, EU, Asia (comma separated)"
                className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                value={formData.eligibility.allowedRegions?.join(", ") || ""}
                onChange={(e) => handleChange("eligibility", "allowedRegions", e.target.value.split(",").map(r => r.trim()))}
              />
              <p className="mt-1 text-xs text-gray-400">
                Leave empty to allow all regions.
              </p>
            </div>
          </div>
        );

      case 3: // Timing
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-gray-300">Start Date</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                  value={formData.timing.startDate}
                  min={new Date().toISOString().split("T")[0]} // Prevent past start dates
                  onChange={(e) => handleChange("timing", "startDate", e.target.value)}
                />
              </div>
              
              <div>
                <label className="mb-2 block text-sm text-gray-300">End Date</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                  value={formData.timing.endDate}
                  min={formData.timing.startDate || new Date().toISOString().split("T")[0]} // End date must be after start date
                  onChange={(e) => handleChange("timing", "endDate", e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="claim-deadline"
                  className="mr-2 h-4 w-4"
                  checked={!!formData.timing.claimDeadline}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const endDate = new Date(formData.timing.endDate);
                      endDate.setDate(endDate.getDate() + 30);
                      handleChange("timing", "claimDeadline", endDate.toISOString().split("T")[0]);
                    } else {
                      handleChange("timing", "claimDeadline", undefined);
                    }
                  }}
                />
                <label htmlFor="claim-deadline" className="text-sm text-gray-300">
                  Set Claim Deadline (Optional)
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Allow claiming after the airdrop end date until this deadline.
              </p>
            </div>

            {formData.timing.claimDeadline && (
              <div>
                <label className="mb-2 block text-sm text-gray-300">Claim Deadline</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-white"
                  value={formData.timing.claimDeadline}
                   min={formData.timing.endDate || new Date().toISOString().split("T")[0]} // Claim deadline must be after end date
                  onChange={(e) => handleChange("timing", "claimDeadline", e.target.value)}
                />
              </div>
            )}
          </div>
        );

      case 4: // Review & Approve
        return (
          <div className="space-y-6">
            <ShineBorderCard className="p-4" borderClassName="border border-gray-700">
              <h3 className="mb-2 flex items-center text-lg font-medium text-white">
                <Gift className="mr-2 h-5 w-5" />
                Token Details
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-gray-400">Token:</div>
                <div className="text-white">{formData.tokenDetails.tokenName} ({formData.tokenDetails.tokenSymbol})</div>
                <div className="text-gray-400">Address:</div>
                <div className="text-white truncate">{formData.tokenDetails.tokenAddress || "Not specified"}</div>
                <div className="text-gray-400">Type:</div>
                <div className="text-white">{formData.tokenDetails.tokenType}</div>
                 <div className="text-gray-400">Total to Airdrop:</div>
                <div className="text-white">{tokenMetadataInfo ? formatTokenAmount(totalTokensToAirdrop) : totalTokensToAirdrop.toString()} {formData.tokenDetails.tokenSymbol}</div>

              </div>
            </ShineBorderCard>

            <ShineBorderCard className="p-4" borderClassName="border border-gray-700">
              <h3 className="mb-2 flex items-center text-lg font-medium text-white">
                <Users className="mr-2 h-5 w-5" />
                Distribution
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-gray-400">Recipients:</div>
                <div className="text-white">{parsedRecipients.length} addresses</div>
                <div className="text-gray-400">Merkle Tree:</div>
                <div className="text-white">{formData.distribution.hasMerkleTree ? "Enabled" : "Disabled"}</div>
                {formData.distribution.hasMerkleTree && merkleRootDisplay && (
                    <>
                        <div className="text-gray-400">Merkle Root:</div>
                        <div className="text-white truncate">{merkleRootDisplay}</div>
                    </>
                )}
              </div>
            </ShineBorderCard>
            
            {/* Token Allowance Section */}
            {formData.tokenDetails.tokenAddress && totalTokensToAirdrop > BigInt(0) && tokenMetadataInfo && (
                 <ShineBorderCard className="p-4" borderClassName="border border-gray-700">
                    <h3 className="mb-2 flex items-center text-lg font-medium text-white">
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Token Allowance
                    </h3>
                    {isAllowanceLoading && <p className="text-blue-400">Checking allowance...</p>}
                    {allowanceError && <p className="text-red-400">Error checking allowance: {allowanceError.message}</p>}
                    {!isAllowanceLoading && !allowanceError && (
                        <>
                            <p className="text-sm text-gray-300 mb-2">
                                Current allowance for Airdrop Factory ({airdropFactoryAddress?.substring(0,6)}...{airdropFactoryAddress?.substring(airdropFactoryAddress.length-4)}): 
                                <strong className="text-white ml-1">{tokenMetadataInfo ? formatTokenAmount(allowance) : allowance.toString()} {formData.tokenDetails.tokenSymbol}</strong>
                            </p>
                            {hasSufficientAllowance ? (
                                <div className="flex items-center text-green-400">
                                    <CheckCircle className="mr-2 h-5 w-5" />
                                    Sufficient allowance granted.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-amber-400">
                                        You need to approve at least {tokenMetadataInfo ? formatTokenAmount(totalTokensToAirdrop) : totalTokensToAirdrop.toString()} {formData.tokenDetails.tokenSymbol} for the Airdrop Factory contract.
                                    </p>
                                    <Button 
                                        onClick={handleApprove} 
                                        disabled={isApprovePending || isApproveConfirming}
                                        className="w-full"
                                    >
                                        {isApprovePending && <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending Approval...</>}
                                        {isApproveConfirming && <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Confirming Approval...</>}
                                        {!isApprovePending && !isApproveConfirming && `Approve ${tokenMetadataInfo ? formatTokenAmount(totalTokensToAirdrop) : totalTokensToAirdrop.toString()} ${formData.tokenDetails.tokenSymbol}`}
                                    </Button>
                                    {approveHash && <p className="text-xs text-gray-400">Approval Tx: <a href={`https://etherscan.io/tx/${approveHash}`} target="_blank" rel="noopener noreferrer" className="underline">{approveHash.substring(0,10)}...</a></p>}
                                </div>
                            )}
                             {isApproveSuccess && <p className="text-green-400 mt-2">Approval successful!</p>}
                        </>
                    )}
                </ShineBorderCard>
            )}


            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
              <div className="flex items-start">
                <Info className="mr-3 h-5 w-5 text-amber-400" />
                <div>
                  <h4 className="font-medium text-amber-400">Important Notice</h4>
                  <p className="text-sm text-amber-300/70">
                    Creating an airdrop will require signing a transaction and paying gas fees. 
                    Ensure the Airdrop Factory contract has sufficient token allowance.
                    Please review all details carefully before proceeding.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };
  
  const renderPreviewPanel = () => {
    const amountDisplay = tokenMetadataInfo && totalTokensToAirdrop > BigInt(0) && parsedRecipients.length > 0
      ? `${tokenMetadataInfo ? formatTokenAmount(parsedRecipients[0].amount) : parsedRecipients[0].amount.toString()} (example first recipient)`
      : `Not set`;

    // Consistent date formatting to avoid hydration mismatch
    const formatDateForPreview = (dateString: string) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      // Pad month and day with leading zero if needed for MM/DD/YYYY format
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    };

    return (
      <div className="sticky top-8">
        <GlassmorphismCard className="overflow-hidden p-5">
          <h3 className="mb-4 text-lg font-semibold text-white">Airdrop Preview</h3>
          
          <div className="flex flex-col items-center">
            <div className="mb-3 h-16 w-16 overflow-hidden rounded-full bg-gray-800">
              {formData.tokenDetails.logoUrl ? (
                <Image
                  src={formData.tokenDetails.logoUrl}
                  alt="Token Logo"
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Gift className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            
            <h4 className="mb-1 text-xl font-bold text-white">
              {formData.tokenDetails.tokenName || "Token Name"}
            </h4>
            <p className="mb-3 text-gray-400">
              {formData.tokenDetails.tokenSymbol || "SYMBOL"}
            </p>
            
            <div className="mb-6 w-full rounded-lg bg-gray-800/50 p-3 text-center">
              <p className="text-sm text-gray-400">
                {formData.distribution.hasMerkleTree ? "Amount (Example)" : "Amount Per Wallet"}
              </p>
              <p className="text-xl font-bold text-white">
                 {amountDisplay} {formData.tokenDetails.tokenSymbol || "SYMBOL"}
              </p>
               {formData.distribution.hasMerkleTree && parsedRecipients.length > 0 && tokenMetadataInfo && (
                  <p className="text-xs text-gray-500 mt-1">
                    Total: {tokenMetadataInfo ? formatTokenAmount(totalTokensToAirdrop) : totalTokensToAirdrop.toString()} {formData.tokenDetails.tokenSymbol} for {parsedRecipients.length} recipients
                  </p>
                )}
            </div>
            
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Type:</span>
                <span className="text-sm text-white">{formData.tokenDetails.tokenType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Recipients:</span>
                <span className="text-sm text-white">{parsedRecipients.length > 0 ? parsedRecipients.length : formData.distribution.recipientAddresses.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Merkle Tree:</span>
                <span className="text-sm text-white">{formData.distribution.hasMerkleTree ? "Yes" : "No"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Duration:</span>
                <span className="text-sm text-white">
                  {formatDateForPreview(formData.timing.startDate)} - {formatDateForPreview(formData.timing.endDate)}
                </span>
              </div>
            </div>
          </div>
        </GlassmorphismCard>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen w-full bg-black">
      <div className="fixed inset-0 -z-10 opacity-30">
        <Particles
          className="absolute inset-0"
          quantity={30}
          staticity={50}
          color="#ffffff"
        />
      </div>

      <Confetti trigger={showConfetti} duration={5000} />

      <div className="container mx-auto px-4 py-8">
        {isCreateAirdropSuccess ? (
          <div className="flex flex-col items-center justify-center py-16">
            <AnimatedBeamsContainer
              beams={5}
              colorFrom="rgba(59, 130, 246, 0.6)"
              colorTo="rgba(236, 72, 153, 0.6)"
              className="h-32 w-32 rounded-full"
            >
              <div className="flex h-full w-full items-center justify-center">
                <CheckCircle className="h-16 w-16 text-green-400" />
              </div>
            </AnimatedBeamsContainer>
            
            <h1 className="mt-6 text-3xl font-bold text-white">Airdrop Created!</h1>
            <p className="mt-2 text-center text-lg text-gray-300">
              Your airdrop has been successfully created. Transaction: 
              <a href={`https://etherscan.io/tx/${createAirdropHash}`} target="_blank" rel="noopener noreferrer" className="underline ml-1">{createAirdropHash?.substring(0,10)}...</a>
            </p>
            
            <div className="mt-8 flex space-x-4">
              <CoolMode colors={["#10b981", "#059669", "#047857"]}>
                <motion.a
                  href="/airdrops/manage"
                  className="rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-6 py-3 text-white shadow-lg hover:from-green-500 hover:to-green-600"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Manage Airdrops
                </motion.a>
              </CoolMode>
              
              <CoolMode colors={["#3b82f6", "#2563eb", "#1d4ed8"]}>
                <motion.a
                  href="/airdrops/explore"
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-white shadow-lg hover:from-blue-500 hover:to-blue-600"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Explore Airdrops
                </motion.a>
              </CoolMode>
            </div>
          </div>
        ) : (
          <>
            <h1 className="mb-8 text-4xl font-bold text-white">Create Airdrop</h1>

            <div className="mb-8">
              <div className="flex flex-wrap justify-center">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="relative flex items-center"
                  >
                    {index > 0 && (
                      <div className={`hidden h-[2px] w-12 md:block ${index <= currentStep ? 'bg-blue-500' : 'bg-gray-700'}`} />
                    )}
                    <div 
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        index < currentStep
                          ? 'bg-blue-500 text-white'
                          : index === currentStep
                          ? 'border-2 border-blue-500 bg-gray-900 text-blue-400'
                          : 'border border-gray-700 bg-gray-900 text-gray-400'
                      }`}
                    >
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className={`ml-2 hidden text-sm md:block ${
                      index <= currentStep ? 'text-white' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <GlassmorphismCard className="p-6">
                  <h2 className="mb-6 text-xl font-semibold text-white">
                    {steps[currentStep].title}
                  </h2>
                  
                  {renderStepContent()}
                  
                  <div className="mt-8 flex justify-between">
                    <motion.button
                      className={`flex items-center rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-white ${
                        currentStep === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-600'
                      }`}
                      onClick={prevStep}
                      disabled={currentStep === 0}
                      whileHover={currentStep !== 0 ? { scale: 1.02 } : {}}
                      whileTap={currentStep !== 0 ? { scale: 0.98 } : {}}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Previous
                    </motion.button>
                    
                    {currentStep < steps.length - 1 ? (
                      <CoolMode colors={["#3b82f6", "#8b5cf6", "#ec4899"]}>
                        <motion.button
                          className={`flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-white shadow-lg ${isNextDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={nextStep}
                          disabled={isNextDisabled}
                          whileHover={!isNextDisabled ? { scale: 1.02 } : {}}
                          whileTap={!isNextDisabled ? { scale: 0.98 } : {}}
                        >
                          Next
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </motion.button>
                      </CoolMode>
                    ) : (
                      <CoolMode colors={["#10b981", "#059669", "#047857"]}>
                        <motion.button
                          className={`flex items-center rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-6 py-2 text-white shadow-lg ${(!hasSufficientAllowance && totalTokensToAirdrop > BigInt(0)) || isCreatingAirdrop || isCreateAirdropConfirming ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={handleSubmit}
                          disabled={(!hasSufficientAllowance && totalTokensToAirdrop > BigInt(0)) || isCreatingAirdrop || isCreateAirdropConfirming}
                          whileHover={!((!hasSufficientAllowance && totalTokensToAirdrop > BigInt(0)) || isCreatingAirdrop || isCreateAirdropConfirming) ? { scale: 1.02 } : {}}
                          whileTap={!((!hasSufficientAllowance && totalTokensToAirdrop > BigInt(0)) || isCreatingAirdrop || isCreateAirdropConfirming) ? { scale: 0.98 } : {}}
                        >
                          {isCreatingAirdrop || isCreateAirdropConfirming ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {isCreatingAirdrop ? "Sending Transaction..." : "Confirming Airdrop..."}
                            </>
                          ) : (
                            <>
                              Create Airdrop
                              <CheckCircle className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </motion.button>
                      </CoolMode>
                    )}
                  </div>
                   {createAirdropError && <p className="mt-4 text-sm text-red-400">Error: {createAirdropError.message}</p>}

                </GlassmorphismCard>
              </div>
              
              <div className="hidden lg:block">
                {renderPreviewPanel()}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 