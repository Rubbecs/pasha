
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import WalletConnect from '@/components/WalletConnect';
import CoinLauncher from '@/components/CoinLauncher';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { WalletInfo } from '@/types';
import { PublicKey } from '@solana/web3.js';

const Index = () => {
  const [wallet, setWallet] = useState<any>(null);
  const [walletInfo, setWalletInfo] = useState<WalletInfo>({
    publicKey: null,
    connected: false,
  });

  useEffect(() => {
    // Update wallet info when the wallet changes
    if (wallet) {
      setWalletInfo({
        publicKey: wallet.publicKey,
        connected: true,
      });
    } else {
      setWalletInfo({
        publicKey: null,
        connected: false,
      });
    }
  }, [wallet]);

  const handleWalletConnect = (newWallet: any) => {
    setWallet(newWallet);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
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
              Create and launch your own tokens on the Solana blockchain with ease
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="md:col-span-4"
            >
              <WalletConnect 
                onWalletConnect={handleWalletConnect} 
                walletInfo={walletInfo}
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="md:col-span-8"
            >
              <CoinLauncher 
                wallet={wallet} 
                isConnected={walletInfo.connected}
              />
            </motion.div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
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
