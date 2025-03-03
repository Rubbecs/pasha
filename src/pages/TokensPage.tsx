
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TokenExchange from '@/components/TokenExchange';
import TokenSeller from '@/components/TokenSeller';
import { WalletInfo, WalletDetails, TokenInfo } from '@/types';
import { getBalance } from '@/lib/solana';
import WalletConnect from '@/components/WalletConnect';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, ArrowLeftIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const TokensPage = () => {
  const [wallets, setWallets] = useState<WalletDetails[]>([]);
  const [walletInfo, setWalletInfo] = useState<WalletInfo>({
    publicKey: null,
    connected: false,
    activeWalletIndex: -1,
  });
  const [launchedTokens, setLaunchedTokens] = useState<TokenInfo[]>([]);
  const navigate = useNavigate();

  const handleWalletConnect = (newWallet: any, index: number) => {
    setWalletInfo({
      publicKey: newWallet?.publicKey || null,
      connected: !!newWallet,
      activeWalletIndex: newWallet ? index : -1,
    });
  };

  const handleAddWallet = (wallet: WalletDetails) => {
    setWallets(prev => [...prev, wallet]);
  };

  const handleRemoveWallet = (id: string) => {
    setWallets(prev => {
      const updatedWallets = prev.filter(wallet => wallet.id !== id);
      
      // If we're removing the active wallet, update the active wallet
      if (walletInfo.activeWalletIndex >= 0 && prev[walletInfo.activeWalletIndex]?.id === id) {
        if (updatedWallets.length > 0) {
          // Set first available wallet as active
          handleWalletConnect(updatedWallets[0].keypair, 0);
        } else {
          // No wallets left
          handleWalletConnect(null, -1);
        }
      } else if (walletInfo.activeWalletIndex >= updatedWallets.length) {
        // If the active index is now out of bounds, adjust it
        if (updatedWallets.length > 0) {
          handleWalletConnect(updatedWallets[updatedWallets.length - 1].keypair, updatedWallets.length - 1);
        } else {
          handleWalletConnect(null, -1);
        }
      }
      
      return updatedWallets;
    });
  };

  const handleSwitchWallet = (index: number) => {
    if (index >= 0 && index < wallets.length) {
      handleWalletConnect(wallets[index].keypair, index);
    }
  };

  const handleRefreshBalance = async (id: string) => {
    // Get the current wallet list
    const updatedWallets = [...wallets];
    
    // Find the wallet to update and update its balance
    for (let i = 0; i < updatedWallets.length; i++) {
      if (updatedWallets[i].id === id) {
        const newBalance = await getBalance(updatedWallets[i].publicKey);
        updatedWallets[i] = {
          ...updatedWallets[i],
          balance: newBalance
        };
      }
    }
    
    // Update state with the new wallet list
    setWallets(updatedWallets);
  };

  const getActiveWallet = (): WalletDetails | null => {
    if (walletInfo.activeWalletIndex >= 0 && walletInfo.activeWalletIndex < wallets.length) {
      return wallets[walletInfo.activeWalletIndex];
    }
    return null;
  };

  // Get tokens from localStorage if available
  useEffect(() => {
    const storedTokens = localStorage.getItem('launchedTokens');
    if (storedTokens) {
      try {
        setLaunchedTokens(JSON.parse(storedTokens));
      } catch (error) {
        console.error('Failed to parse stored tokens:', error);
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          <div className="mb-6 flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            
            <h1 className="text-3xl font-light">Token Exchange</h1>
          </div>
          
          <Alert className="mb-6 bg-black/20 border-solana/20">
            <InfoIcon className="h-4 w-4 text-solana" />
            <AlertDescription>
              Buy and sell tokens on the Solana blockchain. Connect your wallet to get started.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="lg:col-span-4"
            >
              <WalletConnect 
                onWalletConnect={handleWalletConnect} 
                walletInfo={walletInfo}
                wallets={wallets}
                onAddWallet={handleAddWallet}
                onRemoveWallet={handleRemoveWallet}
                onSwitchWallet={handleSwitchWallet}
                onRefreshBalance={handleRefreshBalance}
              />
            </motion.div>
            
            <div className="lg:col-span-8 space-y-8">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <TokenExchange
                  wallets={wallets}
                  launchedTokens={launchedTokens}
                  activeWalletIndex={walletInfo.activeWalletIndex}
                  onSwitchWallet={handleSwitchWallet}
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <TokenSeller wallet={getActiveWallet()} />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TokensPage;
