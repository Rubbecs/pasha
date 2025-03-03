import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CoinsIcon, CheckCircleIcon, AlertTriangleIcon, InfoIcon } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { launchToken } from "@/lib/solana";
import { CoinDetails, TransactionStatus } from "@/types";
import TransactionStatusComponent from './TransactionStatus';

interface CoinLauncherProps {
  wallet: any;
  isConnected: boolean;
  onSuccess?: (tokenAddress: string) => void;
}

const CoinLauncher: React.FC<CoinLauncherProps> = ({ wallet, isConnected, onSuccess }) => {
  const [coinDetails, setCoinDetails] = useState<CoinDetails>({
    name: '',
    symbol: '',
    decimals: 9,
    totalSupply: 1000000,
    gasFee: 0.001, // Default gas fee
    tip: 0,       // Default tip
  });
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({
    status: 'idle',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'decimals' || name === 'totalSupply' || name === 'gasFee' || name === 'tip') {
      const numValue = parseFloat(value);
      setCoinDetails(prevDetails => ({
        ...prevDetails,
        [name]: isNaN(numValue) ? 0 : numValue,
      }));
    } else {
      setCoinDetails(prevDetails => ({
        ...prevDetails,
        [name]: value,
      }));
    }
  };

  const handleLaunchToken = async () => {
    if (!wallet) {
      toast.error('Please connect your wallet first.');
      return;
    }
    
    if (!coinDetails.name || !coinDetails.symbol) {
      toast.error('Token name and symbol are required');
      return;
    }
    
    if (coinDetails.decimals < 0 || coinDetails.decimals > 18) {
      toast.error('Decimals must be between 0 and 18');
      return;
    }
    
    if (coinDetails.totalSupply <= 0) {
      toast.error('Total supply must be greater than 0');
      return;
    }
    
    if (coinDetails.gasFee < 0) {
      toast.error('Gas fee cannot be negative');
      return;
    }
    
    if (coinDetails.tip < 0) {
      toast.error('Tip cannot be negative');
      return;
    }

    setTransactionStatus({ status: 'pending', message: 'Launching token...' });

    try {
      const result = await launchToken(wallet, coinDetails);

      if (result.tokenAddress && result.transactionId) {
        setTransactionStatus({
          status: 'success',
          message: 'Token launched successfully!',
          txId: result.transactionId,
        });
        toast.success('Token launched successfully!');
        
        if (onSuccess && result.tokenAddress) {
          onSuccess(result.tokenAddress);
        }
      } else {
        setTransactionStatus({
          status: 'error',
          message: result.error || 'Failed to launch token.',
        });
        toast.error(result.error || 'Failed to launch token.');
      }
    } catch (error: any) {
      console.error('Token launch error:', error);
      setTransactionStatus({
        status: 'error',
        message: error.message || 'An unexpected error occurred.',
      });
      toast.error(error.message || 'An unexpected error occurred.');
    }
  };

  return (
    <Card className="w-full glass-panel">
      <CardHeader>
        <CardTitle className="text-2xl font-light">Coin Launcher</CardTitle>
        <CardDescription>
          Configure your token details and launch it on the Solana blockchain.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <Alert variant="destructive">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertTitle>Wallet Not Connected</AlertTitle>
            <AlertDescription>
              Please connect your wallet to launch a token.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="space-y-2">
              <Input
                type="text"
                name="name"
                placeholder="Token Name"
                value={coinDetails.name}
                onChange={handleChange}
                className="glass-input"
              />
              <Input
                type="text"
                name="symbol"
                placeholder="Token Symbol"
                value={coinDetails.symbol}
                onChange={handleChange}
                className="glass-input"
              />
              <Input
                type="number"
                name="decimals"
                placeholder="Decimals"
                value={coinDetails.decimals}
                onChange={handleChange}
                className="glass-input"
              />
              <Input
                type="number"
                name="totalSupply"
                placeholder="Total Supply"
                value={coinDetails.totalSupply}
                onChange={handleChange}
                className="glass-input"
              />
              <Textarea
                placeholder="Description"
                name="description"
                value={coinDetails.description || ''}
                onChange={handleChange}
                className="glass-input"
              />
              
              <div className="pt-3">
                <div className="flex items-center mb-1">
                  <InfoIcon className="h-4 w-4 mr-1 text-solana-secondary" />
                  <span className="text-sm text-gray-300">Transaction Fee Settings</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="gasFee" className="text-xs text-gray-400 mb-1 block">
                      Gas Fee (SOL)
                    </label>
                    <Input
                      id="gasFee"
                      type="number"
                      name="gasFee"
                      placeholder="Gas Fee in SOL"
                      value={coinDetails.gasFee}
                      onChange={handleChange}
                      className="glass-input"
                      step="0.001"
                      min="0"
                    />
                  </div>
                  <div>
                    <label htmlFor="tip" className="text-xs text-gray-400 mb-1 block">
                      Tip (SOL)
                    </label>
                    <Input
                      id="tip"
                      type="number"
                      name="tip"
                      placeholder="Optional Tip in SOL"
                      value={coinDetails.tip}
                      onChange={handleChange}
                      className="glass-input"
                      step="0.001"
                      min="0"
                    />
                  </div>
                </div>
                {(coinDetails.gasFee > 0 || coinDetails.tip > 0) && (
                  <div className="mt-2 text-xs text-gray-400">
                    Total fees: {(Number(coinDetails.gasFee) + Number(coinDetails.tip)).toFixed(3)} SOL
                  </div>
                )}
              </div>
            </div>
            <Separator />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                className="w-full bg-gradient-to-r from-solana to-solana-secondary hover:opacity-90 transition-opacity"
                onClick={handleLaunchToken}
                disabled={transactionStatus.status === 'pending'}
              >
                {transactionStatus.status === 'pending' ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Launching...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CoinsIcon className="h-4 w-4" />
                    Launch Token
                  </span>
                )}
              </Button>
            </motion.div>
            {transactionStatus.status !== 'idle' && (
              <TransactionStatusComponent status={transactionStatus} />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CoinLauncher;
