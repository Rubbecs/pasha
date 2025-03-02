
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import WalletConnect from '@/components/WalletConnect';
import CoinLauncher from '@/components/CoinLauncher';
import TokenSeller from '@/components/TokenSeller';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { WalletInfo, WalletDetails } from '@/types';
import { getBalance } from '@/lib/solana';

const Index = () => {
  const [wallets, setWallets] = useState<WalletDetails[]>([]);
  const [walletInfo, setWalletInfo] = useState<WalletInfo>({
    publicKey: null,
    connected: false,
    activeWalletIndex: -1,
  });

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

  // Fixed to no longer return a Promise
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
          <div className="text-center mb-12">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-4xl md:text-5xl font-light mb-4"
            >
              Solana Bundlr
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-lg text-gray-300 max-w-2xl mx-auto"
            >
              Create, launch, and manage tokens on the Solana blockchain with ease
            </motion.p>
          </div>
          
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
                <CoinLauncher 
                  wallet={getActiveWallet()?.keypair || null} 
                  isConnected={walletInfo.connected}
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
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-16 text-center"
          >
            <h2 className="text-2xl font-light mb-4">Why Launch on Solana?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="glass-panel p-6">
                <div className="w-12 h-12 bg-solana/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6 text-solana" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">Lightning Fast</h3>
                <p className="text-sm text-gray-300">
                  Solana processes thousands of transactions per second with sub-second finality.
                </p>
              </div>
              
              <div className="glass-panel p-6">
                <div className="w-12 h-12 bg-solana-secondary/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6 text-solana-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">Low Cost</h3>
                <p className="text-sm text-gray-300">
                  Transactions on Solana cost fractions of a penny, making token creation affordable.
                </p>
              </div>
              
              <div className="glass-panel p-6">
                <div className="w-12 h-12 bg-solana-tertiary/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6 text-solana-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">Secure & Scalable</h3>
                <p className="text-sm text-gray-300">
                  Built with advanced cryptography and designed to scale with your project's needs.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
