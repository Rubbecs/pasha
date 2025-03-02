import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CoinsIcon, CheckCircleIcon, AlertTriangleIcon } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { launchToken } from "@/lib/solana";
import { CoinDetails, TransactionStatus } from "@/types";
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
  });
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({
    status: 'idle',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCoinDetails(prevDetails => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  const handleLaunchToken = async () => {
    if (!wallet) {
      toast.error('Please connect your wallet first.');
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
                value={coinDetails.description}
                onChange={handleChange}
                className="glass-input"
              />
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
