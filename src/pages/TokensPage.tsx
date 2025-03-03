
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
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getUserWallets, saveWallet, deleteWallet, updateWalletBalance } from '@/lib/walletService';

const TokensPage = () => {
  const [wallets, setWallets] = useState<WalletDetails[]>([]);
  const [walletInfo, setWalletInfo] = useState<WalletInfo>({
    publicKey: null,
    connected: false,
    activeWalletIndex: -1,
  });
  const [launchedTokens, setLaunchedTokens] = useState<TokenInfo[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (!data.session) {
        toast.error('Please sign in to access your wallets');
        navigate('/auth');
        return;
      }
      
      setIsAuthenticated(true);
      
      // Load wallets from Supabase
      try {
        // Use the user's password hash as the encryption key (simplified for demo)
        // In a real app, you'd want a more secure approach
        const encryptionKey = data.session.user.id;
        const userWallets = await getUserWallets(encryptionKey);
        
        setWallets(userWallets);
        
        // Set active wallet if available
        if (userWallets.length > 0) {
          handleWalletConnect(userWallets[0].keypair, 0);
        }
      } catch (error) {
        console.error('Error loading wallets:', error);
        toast.error('Failed to load wallets');
      }
    };
    
    checkAuth();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/auth');
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Get tokens from localStorage if available
  useEffect(() => {
    const getTokens = async () => {
      try {
        const { data, error } = await supabase
          .from('user_tokens')
          .select('*');
          
        if (error) {
          console.error('Error fetching tokens:', error);
          return;
        }
        
        if (data) {
          setLaunchedTokens(data.map(token => ({
            address: token.address,
            amount: token.amount,
            decimals: token.decimals,
            symbol: token.symbol,
            name: token.name
          })));
        }
      } catch (error) {
        console.error('Failed to fetch tokens:', error);
      }
    };
    
    if (isAuthenticated) {
      getTokens();
    }
  }, [isAuthenticated]);

  const handleWalletConnect = (newWallet: any, index: number) => {
    setWalletInfo({
      publicKey: newWallet?.publicKey || null,
      connected: !!newWallet,
      activeWalletIndex: newWallet ? index : -1,
    });
  };

  const handleAddWallet = async (wallet: WalletDetails) => {
    try {
      // Get current session
      const { data } = await supabase.auth.getSession();
      
      if (!data.session) {
        toast.error('Please sign in to add a wallet');
        navigate('/auth');
        return false;
      }
      
      // Use the user's ID as the encryption key (simplified for demo)
      const encryptionKey = data.session.user.id;
      
      // Save wallet to Supabase
      const savedWallet = await saveWallet(wallet, encryptionKey);
      
      if (savedWallet) {
        setWallets(prev => [...prev, savedWallet]);
        return true;
      } else {
        toast.error('Failed to save wallet');
        return false;
      }
    } catch (error) {
      console.error('Error adding wallet:', error);
      toast.error('Failed to add wallet');
      return false;
    }
  };

  const handleRemoveWallet = async (id: string) => {
    try {
      const success = await deleteWallet(id);
      
      if (success) {
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
        
        toast.success('Wallet removed successfully');
      } else {
        toast.error('Failed to remove wallet');
      }
    } catch (error) {
      console.error('Error removing wallet:', error);
      toast.error('Failed to remove wallet');
    }
  };

  const handleSwitchWallet = (index: number) => {
    if (index >= 0 && index < wallets.length) {
      handleWalletConnect(wallets[index].keypair, index);
    }
  };

  const handleRefreshBalance = async (id: string) => {
    try {
      // Find the wallet to update
      const walletToUpdate = wallets.find(wallet => wallet.id === id);
      
      if (!walletToUpdate) {
        toast.error('Wallet not found');
        return;
      }
      
      // Update the balance
      const newBalance = await updateWalletBalance(walletToUpdate);
      
      // Update the wallet in state
      setWallets(prev => 
        prev.map(wallet => 
          wallet.id === id ? { ...wallet, balance: newBalance } : wallet
        )
      );
      
      toast.success('Balance refreshed successfully');
    } catch (error) {
      console.error('Error refreshing balance:', error);
      toast.error('Failed to refresh balance');
    }
  };

  const getActiveWallet = (): WalletDetails | null => {
    if (walletInfo.activeWalletIndex >= 0 && walletInfo.activeWalletIndex < wallets.length) {
      return wallets[walletInfo.activeWalletIndex];
    }
    return null;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <Card className="w-full max-w-md mx-auto bg-black/30">
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
              <CardDescription>
                Please wait while we check your authentication status
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

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
