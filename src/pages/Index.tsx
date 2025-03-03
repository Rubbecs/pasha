
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import WalletConnect from '@/components/WalletConnect';
import CoinLauncher from '@/components/CoinLauncher';
import TokenSeller from '@/components/TokenSeller';
import TokenExchange from '@/components/TokenExchange';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { WalletInfo, WalletDetails, TokenInfo } from '@/types';
import { getBalance, getUserTokens, buyToken } from '@/lib/solana';
import { Button } from '@/components/ui/button';
import { CoinsIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import LoginPage from '@/components/LoginPage';

const Index = () => {
  const [wallets, setWallets] = useState<WalletDetails[]>([]);
  const [walletInfo, setWalletInfo] = useState<WalletInfo>({
    publicKey: null,
    connected: false,
    activeWalletIndex: -1,
  });
  const [launchedTokens, setLaunchedTokens] = useState<TokenInfo[]>([]);
  const [showExchange, setShowExchange] = useState(false);
  const [autoBuyAmount, setAutoBuyAmount] = useState(0.01); // Default amount for auto-buy
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
      
      if (walletInfo.activeWalletIndex >= 0 && prev[walletInfo.activeWalletIndex]?.id === id) {
        if (updatedWallets.length > 0) {
          handleWalletConnect(updatedWallets[0].keypair, 0);
        } else {
          handleWalletConnect(null, -1);
        }
      } else if (walletInfo.activeWalletIndex >= updatedWallets.length) {
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
    const updatedWallets = [...wallets];
    
    for (let i = 0; i < updatedWallets.length; i++) {
      if (updatedWallets[i].id === id) {
        const newBalance = await getBalance(updatedWallets[i].publicKey);
        updatedWallets[i] = {
          ...updatedWallets[i],
          balance: newBalance
        };
      }
    }
    
    setWallets(updatedWallets);
  };

  const getActiveWallet = (): WalletDetails | null => {
    if (walletInfo.activeWalletIndex >= 0 && walletInfo.activeWalletIndex < wallets.length) {
      return wallets[walletInfo.activeWalletIndex];
    }
    return null;
  };

  const autoBuyWithAllWallets = async (tokenAddress: string) => {
    if (wallets.length === 0) return;
    
    toast.info(`Auto-buying new token with ${wallets.length} wallets`);
    
    // Process wallets sequentially to avoid network congestion
    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      try {
        toast.info(`Auto-buying with wallet ${wallet.name}...`);
        
        // Use a random amount between 0.005 and 0.02 SOL for variety
        const buyAmount = autoBuyAmount * (0.5 + Math.random());
        
        const result = await buyToken(
          wallet.keypair, 
          tokenAddress, 
          buyAmount, 
          { gasFee: 0.001, tip: 0 }
        );
        
        if (result.transactionId) {
          toast.success(`Auto-buy successful with wallet ${wallet.name}`);
        } else {
          toast.error(`Auto-buy failed with wallet ${wallet.name}: ${result.error}`);
        }
        
        // Add a small delay between transactions
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Auto-buy failed for wallet ${wallet.name}:`, error);
        toast.error(`Auto-buy failed for wallet ${wallet.name}`);
      }
    }
    
    // Refresh balances after all transactions
    toast.success('Auto-buy process completed');
    
    // Refresh all wallet balances
    for (const wallet of wallets) {
      handleRefreshBalance(wallet.id);
    }
  };

  const handleTokenLaunched = async (tokenAddress: string) => {
    const storedTokens = localStorage.getItem('launchedTokens');
    let updatedTokens: TokenInfo[] = [];
    
    if (storedTokens) {
      try {
        updatedTokens = JSON.parse(storedTokens);
      } catch (error) {
        console.error('Failed to parse stored tokens:', error);
      }
    }
    
    const newToken: TokenInfo = {
      address: tokenAddress,
      amount: 0,
      decimals: 9,
      symbol: 'TOKEN'
    };
    
    updatedTokens = [...updatedTokens, newToken];
    setLaunchedTokens(updatedTokens);
    
    localStorage.setItem('launchedTokens', JSON.stringify(updatedTokens));
    
    // Show exchange after token is launched
    setShowExchange(true);
    
    toast.success(
      <div className="flex flex-col">
        <p>Token launched successfully!</p>
        <p className="text-sm mt-1">You can now buy and sell this token</p>
      </div>
    );
    
    // Auto-buy with all wallets
    await autoBuyWithAllWallets(tokenAddress);
  };

  useEffect(() => {
    // Check if user is already logged in (has profile)
    const storedProfile = localStorage.getItem('solanaBundlrProfile');
    if (storedProfile) {
      try {
        const profile = JSON.parse(storedProfile);
        if (profile.username) {
          // User has a profile, check if they have stored wallets
          const storedWallets = localStorage.getItem('solanaBundlrWallets');
          if (storedWallets) {
            // Don't auto-login, show login screen to enter password
            setIsLoggedIn(false);
          } else {
            // If they have a profile but no wallets, consider them logged in
            setIsLoggedIn(true);
          }
        }
      } catch (error) {
        console.error('Failed to parse stored profile:', error);
      }
    }

    const storedTokens = localStorage.getItem('launchedTokens');
    if (storedTokens) {
      try {
        const tokens = JSON.parse(storedTokens);
        setLaunchedTokens(tokens);
        if (tokens.length > 0) {
          setShowExchange(true);
        }
      } catch (error) {
        console.error('Failed to parse stored tokens:', error);
      }
    }
  }, []);

  const handleLoginComplete = () => {
    setIsLoggedIn(true);
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
          
          {!isLoggedIn ? (
            <LoginPage 
              onWalletConnect={handleWalletConnect}
              onAddWallet={handleAddWallet}
              wallets={wallets}
              onLoginComplete={handleLoginComplete}
            />
          ) : (
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
                    onSuccess={handleTokenLaunched}
                  />
                </motion.div>
                
                {showExchange && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <TokenExchange 
                      wallets={wallets}
                      launchedTokens={launchedTokens}
                      activeWalletIndex={walletInfo.activeWalletIndex}
                      onSwitchWallet={handleSwitchWallet}
                    />
                  </motion.div>
                )}
                
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <TokenSeller wallet={getActiveWallet()} />
                </motion.div>
              </div>
            </div>
          )}
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
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
