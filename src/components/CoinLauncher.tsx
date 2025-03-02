
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CoinIcon, RocketIcon, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { CoinDetails, TransactionStatus } from '@/types';
import { launchToken } from '@/lib/solana';
import { storeCoinMetadata } from '@/lib/bundlr';
import TransactionStatusComponent from './TransactionStatus';

interface CoinLauncherProps {
  wallet: any;
  isConnected: boolean;
}

const CoinLauncher: React.FC<CoinLauncherProps> = ({ wallet, isConnected }) => {
  const [coinDetails, setCoinDetails] = useState<CoinDetails>({
    name: '',
    symbol: '',
    decimals: 9,
    totalSupply: 1000000,
    description: '',
    imageUrl: '',
  });

  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({
    status: 'idle',
  });

  const [tokenAddress, setTokenAddress] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'decimals' || name === 'totalSupply') {
      const numValue = parseInt(value, 10);
      setCoinDetails(prev => ({
        ...prev,
        [name]: isNaN(numValue) ? 0 : numValue
      }));
    } else {
      setCoinDetails(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleLaunchToken = async () => {
    if (!isConnected || !wallet) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    // Validate inputs
    if (!coinDetails.name || !coinDetails.symbol) {
      toast.error('Name and symbol are required');
      return;
    }
    
    if (coinDetails.symbol.length > 10) {
      toast.error('Symbol must be 10 characters or less');
      return;
    }
    
    if (coinDetails.decimals < 0 || coinDetails.decimals > 9) {
      toast.error('Decimals must be between 0 and 9');
      return;
    }
    
    if (coinDetails.totalSupply <= 0) {
      toast.error('Total supply must be greater than 0');
      return;
    }
    
    setTransactionStatus({
      status: 'pending',
      message: 'Creating your token...'
    });
    
    try {
      // Launch the token
      const result = await launchToken(wallet, coinDetails);
      
      if (result.error) {
        setTransactionStatus({
          status: 'error',
          message: result.error
        });
        return;
      }
      
      if (result.tokenAddress && result.transactionId) {
        setTokenAddress(result.tokenAddress);
        
        // Store token metadata using Bundlr
        setTransactionStatus({
          status: 'pending',
          message: 'Storing token metadata...',
          txId: result.transactionId
        });
        
        const metadataUrl = await storeCoinMetadata(
          wallet,
          coinDetails,
          result.tokenAddress
        );
        
        if (metadataUrl) {
          setTransactionStatus({
            status: 'success',
            message: 'Token created successfully!',
            txId: result.transactionId
          });
          
          toast.success('Token launched successfully!');
        } else {
          setTransactionStatus({
            status: 'error',
            message: 'Failed to store token metadata',
            txId: result.transactionId
          });
        }
      } else {
        setTransactionStatus({
          status: 'error',
          message: 'Failed to create token'
        });
      }
    } catch (error) {
      console.error('Token launch error:', error);
      setTransactionStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to launch token'
      });
    }
  };

  const resetForm = () => {
    setCoinDetails({
      name: '',
      symbol: '',
      decimals: 9,
      totalSupply: 1000000,
      description: '',
      imageUrl: '',
    });
    setTransactionStatus({ status: 'idle' });
    setTokenAddress(null);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto glass-panel overflow-hidden">
      <CardHeader className="relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-solana/20 to-solana-secondary/10 rounded-bl-full -z-10" />
        <CardTitle className="text-2xl font-light">Launch Your Token</CardTitle>
        <CardDescription>
          Create and deploy your own SPL token on Solana
        </CardDescription>
      </CardHeader>
      
      {transactionStatus.status === 'success' && tokenAddress ? (
        <CardContent>
          <TransactionStatusComponent status={transactionStatus} />
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-8 space-y-4"
          >
            <div className="bg-black/20 rounded-lg p-4">
              <h3 className="text-sm font-medium mb-2">Token Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Name:</span>
                  <span className="text-sm font-medium">{coinDetails.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Symbol:</span>
                  <span className="text-sm font-medium">{coinDetails.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Decimals:</span>
                  <span className="text-sm font-medium">{coinDetails.decimals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Supply:</span>
                  <span className="text-sm font-medium">
                    {coinDetails.totalSupply.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Token Address:</span>
                  <a
                    href={`https://explorer.solana.com/address/${tokenAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono text-solana hover:underline truncate max-w-[200px]"
                  >
                    {tokenAddress.slice(0, 6)}...{tokenAddress.slice(-6)}
                  </a>
                </div>
              </div>
            </div>
            
            <Button onClick={resetForm} className="w-full">
              Launch Another Token
            </Button>
          </motion.div>
        </CardContent>
      ) : (
        <CardContent>
          {transactionStatus.status !== 'idle' ? (
            <TransactionStatusComponent status={transactionStatus} />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Token Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., My Awesome Token"
                  value={coinDetails.name}
                  onChange={handleInputChange}
                  className="glass-input"
                  disabled={!isConnected}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="symbol">Token Symbol</Label>
                <Input
                  id="symbol"
                  name="symbol"
                  placeholder="e.g., MAT"
                  value={coinDetails.symbol}
                  onChange={handleInputChange}
                  className="glass-input"
                  disabled={!isConnected}
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum 10 characters
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="decimals">Decimals</Label>
                  <Input
                    id="decimals"
                    name="decimals"
                    type="number"
                    min={0}
                    max={9}
                    value={coinDetails.decimals}
                    onChange={handleInputChange}
                    className="glass-input"
                    disabled={!isConnected}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalSupply">Total Supply</Label>
                  <Input
                    id="totalSupply"
                    name="totalSupply"
                    type="number"
                    min={1}
                    value={coinDetails.totalSupply}
                    onChange={handleInputChange}
                    className="glass-input"
                    disabled={!isConnected}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your token..."
                  value={coinDetails.description}
                  onChange={handleInputChange}
                  className="glass-input min-h-[80px]"
                  disabled={!isConnected}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Token Image URL (Optional)</Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  placeholder="https://example.com/token-image.png"
                  value={coinDetails.imageUrl}
                  onChange={handleInputChange}
                  className="glass-input"
                  disabled={!isConnected}
                />
              </div>
            </motion.div>
          )}
        </CardContent>
      )}
      
      <CardFooter className="flex justify-end">
        {transactionStatus.status === 'idle' && (
          <Button 
            onClick={handleLaunchToken} 
            disabled={!isConnected || !coinDetails.name || !coinDetails.symbol}
            className="bg-gradient-to-r from-solana to-solana-secondary hover:opacity-90 transition-opacity"
          >
            <RocketIcon className="h-4 w-4 mr-2" />
            Launch Token
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default CoinLauncher;
