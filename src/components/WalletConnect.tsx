
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LockIcon, UnlockIcon, WalletIcon, CopyIcon, CheckIcon } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { createWalletFromPrivateKey, getBalance } from '@/lib/solana';
import { WalletInfo } from '@/types';

interface WalletConnectProps {
  onWalletConnect: (wallet: any) => void;
  walletInfo: WalletInfo;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ onWalletConnect, walletInfo }) => {
  const [privateKey, setPrivateKey] = useState('');
  const [maskedPrivateKey, setMaskedPrivateKey] = useState('');
  const [isPrivateKeyVisible, setIsPrivateKeyVisible] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (walletInfo.connected && walletInfo.publicKey) {
        const walletBalance = await getBalance(walletInfo.publicKey);
        setBalance(walletBalance);
      }
    };

    fetchBalance();
  }, [walletInfo.connected, walletInfo.publicKey]);

  useEffect(() => {
    if (privateKey) {
      // Mask the private key for display
      setMaskedPrivateKey(privateKey.substring(0, 6) + '...' + privateKey.substring(privateKey.length - 4));
    } else {
      setMaskedPrivateKey('');
    }
  }, [privateKey]);

  const handleConnectWallet = async () => {
    try {
      setIsLoading(true);
      const wallet = createWalletFromPrivateKey(privateKey);
      
      if (wallet) {
        onWalletConnect(wallet);
        toast.success('Wallet connected successfully');
      } else {
        toast.error('Failed to connect wallet');
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      toast.error('Failed to connect wallet: Invalid private key');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
    toast.success('Address copied to clipboard');
  };

  return (
    <Card className="w-full max-w-md mx-auto glass-panel">
      <CardHeader>
        <CardTitle className="text-2xl font-light">Wallet</CardTitle>
        <CardDescription>
          Connect your Solana wallet to launch tokens
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!walletInfo.connected ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-4">
              <div className="relative">
                <Input
                  type={isPrivateKeyVisible ? 'text' : 'password'}
                  placeholder="Enter your private key"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  className="glass-input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setIsPrivateKeyVisible(!isPrivateKeyVisible)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {isPrivateKeyVisible ? (
                    <LockIcon className="h-4 w-4" />
                  ) : (
                    <UnlockIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              <Button 
                onClick={handleConnectWallet} 
                className="w-full bg-gradient-to-r from-solana to-solana-secondary hover:opacity-90 transition-opacity"
                disabled={!privateKey || isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Connecting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <WalletIcon className="h-4 w-4" />
                    Connect Wallet
                  </span>
                )}
              </Button>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="bg-black/20 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Connected Wallet</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm font-mono truncate">
                    {walletInfo.publicKey?.toString().slice(0, 6)}...
                    {walletInfo.publicKey?.toString().slice(-6)}
                  </span>
                  <button
                    onClick={() => walletInfo.publicKey && copyToClipboard(walletInfo.publicKey.toString())}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {copiedAddress ? (
                      <CheckIcon className="h-4 w-4 text-green-400" />
                    ) : (
                      <CopyIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-black/20 to-black/10 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-2">Balance</p>
                <p className="text-2xl font-light">
                  {balance !== null ? (
                    <span>{balance.toFixed(4)} <span className="text-sm text-solana-secondary">SOL</span></span>
                  ) : (
                    <span className="animate-pulse">Loading...</span>
                  )}
                </p>
              </div>
              
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    onWalletConnect(null);
                    setPrivateKey('');
                    setMaskedPrivateKey('');
                    setBalance(null);
                    toast.success('Wallet disconnected');
                  }}
                  className="w-full border-white/10 hover:bg-white/5 transition-all"
                >
                  Disconnect Wallet
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletConnect;
