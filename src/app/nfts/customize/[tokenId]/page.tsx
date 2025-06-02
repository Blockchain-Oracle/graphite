'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useNFTDetails, useCustomizeNFT } from '@/lib/hooks/useNFTs';
import { CUSTOMIZATION_OPTIONS, NFTCustomization } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Particles } from '@/components/magicui/particles';
import { CoolMode } from '@/components/magicui/cool-mode';
import Image from 'next/image';

// Instead of using AnimatedList, create a simpler version
function SimpleAnimatedList({ items, className }: { items: React.ReactNode[], className?: string }) {
  return (
    <div className={className}>
      <div className="space-y-3">
        {items}
      </div>
    </div>
  );
}

export default function CustomizeNFTPage() {
  const { tokenId } = useParams();
  const router = useRouter();
  const parsedTokenId = parseInt(tokenId as string, 10);
  
  const { nft, isLoading, error } = useNFTDetails(
    isNaN(parsedTokenId) ? null : parsedTokenId
  );
  
  const { saveCustomization, isSaving, saveError } = useCustomizeNFT();
  
  const [customization, setCustomization] = useState<NFTCustomization>({
    baseModel: 'standard',
    accessories: [],
    colors: {
      primary: '#000000',
      secondary: '#FFFFFF',
      accent: '#0088FF'
    },
    animation: 'static'
  });
  
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Update customization when NFT loads
  useEffect(() => {
    if (nft?.customizations) {
      setCustomization(nft.customizations);
    }
  }, [nft]);
  
  // Handle customization changes
  const updateBaseModel = (model: string) => {
    setCustomization((prev: NFTCustomization) => ({
      ...prev,
      baseModel: model
    }));
  };
  
  const toggleAccessory = (accessory: string) => {
    setCustomization((prev: NFTCustomization) => {
      const hasAccessory = prev.accessories.includes(accessory);
      return {
        ...prev,
        accessories: hasAccessory
          ? prev.accessories.filter((a: string) => a !== accessory)
          : [...prev.accessories, accessory]
      };
    });
  };
  
  const updateColor = (key: keyof NFTCustomization['colors'], color: string) => {
    setCustomization((prev: NFTCustomization) => ({
      ...prev,
      colors: {
        ...prev.colors,
        [key]: color
      }
    }));
  };
  
  const updateAnimation = (animation: string) => {
    setCustomization((prev: NFTCustomization) => ({
      ...prev,
      animation
    }));
  };
  
  // Handle save customization
  const handleSave = async () => {
    if (!nft || isSaving) return;
    
    try {
      await saveCustomization(nft.tokenId, customization);
      setShowSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving customization:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-pulse">
          <div className="h-32 w-32 bg-secondary/20 rounded-full mx-auto"></div>
          <div className="h-6 w-48 bg-secondary/20 rounded mt-6 mx-auto"></div>
          <div className="h-4 w-64 bg-secondary/10 rounded mt-4 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error || !nft) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-red-500">Error</h2>
        <p className="mt-2 text-muted-foreground">
          {error?.message || 'NFT not found'}
        </p>
        <Button 
          className="mt-6"
          onClick={() => router.push('/nfts/gallery')}
        >
          Back to Gallery
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {/* Background particles effect for premium features */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <Particles
          className="absolute inset-0"
          quantity={100}
          color="#888"
          vy={0.1}
        />
      </div>
      
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/2">
            <h1 className="text-3xl font-bold mb-2">{nft.name}</h1>
            <p className="text-muted-foreground mb-6">
              Customize your NFT to make it unique
            </p>
            
            {showSuccess && (
              <div className="mb-6 p-4 bg-green-100/10 border border-green-500/30 rounded-lg">
                <p className="text-green-500">
                  Customization saved successfully!
                </p>
              </div>
            )}
            
            {saveError && (
              <div className="mb-6 p-4 bg-red-100/10 border border-red-500/30 rounded-lg">
                <p className="text-red-500">
                  Error saving customization: {saveError.message}
                </p>
              </div>
            )}
            
            <Tabs defaultValue="base" className="w-full">
              <TabsList className="grid grid-cols-4 mb-8">
                <TabsTrigger value="base">Base</TabsTrigger>
                <TabsTrigger value="accessories">Accessories</TabsTrigger>
                <TabsTrigger value="colors">Colors</TabsTrigger>
                <TabsTrigger value="animation">Animation</TabsTrigger>
              </TabsList>
              
              <TabsContent value="base" className="space-y-4">
                <h3 className="text-lg font-medium mb-4">Select Base Model</h3>
                
                <SimpleAnimatedList 
                  className="space-y-3"
                  items={CUSTOMIZATION_OPTIONS.baseModels.map((model: string) => (
                    <div 
                      key={model}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        customization.baseModel === model
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => updateBaseModel(model)}
                    >
                      <div className="font-medium capitalize">{model}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {model === 'standard' ? 'Basic model with standard features' :
                         model === 'advanced' ? 'Enhanced model with improved details' :
                         'Premium model with maximum visual fidelity'}
                      </div>
                    </div>
                  ))}
                />
              </TabsContent>
              
              <TabsContent value="accessories" className="space-y-4">
                <h3 className="text-lg font-medium mb-4">Select Accessories</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You can select multiple accessories
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  {CUSTOMIZATION_OPTIONS.accessories.map((accessory: string) => (
                    <div
                      key={accessory}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        customization.accessories.includes(accessory)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => toggleAccessory(accessory)}
                    >
                      <div className="font-medium capitalize">
                        {accessory === 'none' ? 'No Accessories' : accessory}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="colors" className="space-y-6">
                <h3 className="text-lg font-medium mb-4">Customize Colors</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Primary Color
                    </label>
                    <div className="flex items-center">
                      <div 
                        className="w-10 h-10 rounded mr-3 border"
                        style={{ backgroundColor: customization.colors.primary }}
                      />
                      <input
                        type="color"
                        value={customization.colors.primary}
                        onChange={(e) => updateColor('primary', e.target.value)}
                        className="h-9 w-24"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Secondary Color
                    </label>
                    <div className="flex items-center">
                      <div 
                        className="w-10 h-10 rounded mr-3 border"
                        style={{ backgroundColor: customization.colors.secondary }}
                      />
                      <input
                        type="color"
                        value={customization.colors.secondary}
                        onChange={(e) => updateColor('secondary', e.target.value)}
                        className="h-9 w-24"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Accent Color
                    </label>
                    <div className="flex items-center">
                      <div 
                        className="w-10 h-10 rounded mr-3 border"
                        style={{ backgroundColor: customization.colors.accent }}
                      />
                      <input
                        type="color"
                        value={customization.colors.accent}
                        onChange={(e) => updateColor('accent', e.target.value)}
                        className="h-9 w-24"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="animation" className="space-y-4">
                <h3 className="text-lg font-medium mb-4">Select Animation</h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CUSTOMIZATION_OPTIONS.animations.map((animation: string) => (
                    <div
                      key={animation}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        customization.animation === animation
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => updateAnimation(animation)}
                    >
                      <div className="font-medium capitalize">{animation}</div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="mt-8 flex space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/nfts/view/${nft.tokenId}`)}
              >
                Cancel
              </Button>
              
              <CoolMode>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CoolMode>
            </div>
          </div>
          
          <div className="md:w-1/2">
            <div className="bg-black/5 backdrop-blur-sm rounded-lg p-4 h-[400px] flex items-center justify-center">
              <div className="text-center w-full h-full relative">
                {nft && (
                  <Image 
                    src={nft.image || `/trust-badges/${nft.tier.toLowerCase().replace('_', '-')}.svg`}
                    alt={nft.name}
                    fill
                    className="object-contain p-4"
                  />
                )}
                {!nft && <p>Loading image...</p>}
              </div>
            </div>
            
            <div className="mt-6 bg-black/5 backdrop-blur-sm rounded-lg p-4">
              <h3 className="font-medium mb-2">Customization Summary</h3>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Model:</span>
                  <span className="font-medium capitalize">{customization.baseModel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Accessories:</span>
                  <span className="font-medium">
                    {customization.accessories.length === 0
                      ? 'None'
                      : customization.accessories.map((a: string) => 
                          a.charAt(0).toUpperCase() + a.slice(1)
                        ).join(', ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Animation:</span>
                  <span className="font-medium capitalize">{customization.animation}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 