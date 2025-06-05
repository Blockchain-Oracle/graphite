import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, ExternalLink } from 'lucide-react';
import { Confetti } from '@/components/magicui/confetti';
import { AnimatedBeamsContainer } from '@/components/magicui/animated-beam';

interface SuccessTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  txHash?: string;
  entityAddress?: string; // The address of the created entity (vote, airdrop, etc.)
  entityType?: 'vote' | 'airdrop' | 'nft' | 'generic';
  onViewEntity?: () => void;
  redirectPath?: string;
}

export function SuccessTransactionModal({
  isOpen,
  onClose,
  title = 'Transaction Successful!',
  message = 'Your transaction has been confirmed on the blockchain.',
  txHash,
  entityAddress,
  entityType = 'generic',
  onViewEntity,
  redirectPath,
}: SuccessTransactionModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  // Trigger confetti when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Create entity view text based on type
  const getEntityViewText = () => {
    switch (entityType) {
      case 'vote': return 'View Vote';
      case 'airdrop': return 'View Airdrop';
      case 'nft': return 'View NFT';
      default: return 'View Details';
    }
  };

  return (
    <>
      {showConfetti && <Confetti trigger={showConfetti} duration={5000} />}
      
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md bg-gray-900/95 border border-gray-800">
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <AnimatedBeamsContainer
              beams={5}
              colorFrom="rgba(59, 130, 246, 0.6)"
              colorTo="rgba(236, 72, 153, 0.6)"
              className="h-24 w-24 rounded-full"
            >
              <div className="flex h-full w-full items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-400" />
              </div>
            </AnimatedBeamsContainer>
            
            <h2 className="mt-6 text-2xl font-bold text-white">{title}</h2>
            <p className="mt-2 text-gray-300">{message}</p>
            
            {txHash && (
              <div className="mt-4 w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3">
                <p className="mb-1 text-sm text-gray-400">Transaction Hash:</p>
                <a 
                  href={`https://test.atgraphite.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center text-blue-400 hover:text-blue-300 text-sm break-all"
                >
                  <span>{txHash}</span>
                  <ExternalLink className="ml-2 h-3 w-3 flex-shrink-0" />
                </a>
              </div>
            )}
            
            {entityAddress && (
              <div className="mt-3 w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3">
                <p className="mb-1 text-sm text-gray-400">Contract Address:</p>
                <a 
                  href={`https://test.atgraphite.com/address/${entityAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center text-blue-400 hover:text-blue-300 text-sm break-all"
                >
                  <span>{entityAddress}</span>
                  <ExternalLink className="ml-2 h-3 w-3 flex-shrink-0" />
                </a>
              </div>
            )}
            
            <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
              {onViewEntity && (
                <Button 
                  onClick={onViewEntity}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-500 hover:to-green-600"
                >
                  {getEntityViewText()}
                </Button>
              )}
              <Button 
                onClick={onClose}
                variant="outline" 
                className="flex-1 border-gray-700 hover:bg-gray-800"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 