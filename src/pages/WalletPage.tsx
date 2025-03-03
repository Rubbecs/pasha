
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeftIcon, CoinsIcon, BarChart2Icon, WalletIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WalletInfo, WalletDetails, TokenInfo } from '@/types';
import { buyToken } from '@/lib/solana';
import WalletConnect from '@/components/WalletConnect';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const WalletPage = () => {
  const [wallets, setWallets] = useState<WalletDetails[]>([]);
  const [walletInfo, setWalletInfo] = useState<WalletInfo>({
    publicKey: null,
    connected: false,
    activeWalletIndex: -1,
  });
  const [tokenAddress, setTokenAddress] = useState('');
  const [buyAmount, setBuyAmount] = useState(0.01);
  const [isLoading, setIsLoading] = useState(false);
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
    // Get the current wallet list
    const updatedWallets = [...wallets];
    
    // Find the wallet to update and update its balance
    for (let i = 0; i < updatedWallets.length; i++) {
      if (updatedWallets[i].id === id) {
        try {
          const newBalance = await getBalance(updatedWallets[i].publicKey);
          updatedWallets[i] = {
            ...updatedWallets[i],
            balance: newBalance
          };
        } catch (error) {
          console.error("Error refreshing balance:", error);
          toast.error("Failed to refresh balance");
        }
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

  const handleBuyToken = async () => {
    const activeWallet = getActiveWallet();
    if (!activeWallet) {
      toast.error("No wallet connected");
      return;
    }

    if (!tokenAddress.trim()) {
      toast.error("Please enter a token address");
      return;
    }

    setIsLoading(true);
    try {
      const result = await buyToken(
        activeWallet.keypair,
        tokenAddress.trim(),
        buyAmount,
        { gasFee: 0.001, tip: 0 }
      );

      if (result.transactionId) {
        toast.success(`Successfully bought token for ${buyAmount} SOL`);
        handleRefreshBalance(activeWallet.id);
      } else {
        toast.error(`Failed to buy token: ${result.error}`);
      }
    } catch (error) {
      console.error("Error buying token:", error);
      toast.error("Failed to buy token. See console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyWithAllWallets = async () => {
    if (wallets.length === 0) {
      toast.error("No wallets connected");
      return;
    }

    if (!tokenAddress.trim()) {
      toast.error("Please enter a token address");
      return;
    }

    setIsLoading(true);
    toast.info(`Buying token with ${wallets.length} wallets`);

    let successCount = 0;
    let failCount = 0;

    // Process wallets sequentially to avoid network congestion
    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      try {
        toast.info(`Buying with wallet ${wallet.name}...`);
        
        // Use a slight variation in buy amount for each wallet
        const randomizedBuyAmount = buyAmount * (0.8 + Math.random() * 0.4);
        
        const result = await buyToken(
          wallet.keypair, 
          tokenAddress.trim(), 
          randomizedBuyAmount, 
          { gasFee: 0.001, tip: 0 }
        );
        
        if (result.transactionId) {
          successCount++;
        } else {
          failCount++;
          console.error(`Failed to buy with wallet ${wallet.name}: ${result.error}`);
        }
        
        // Add a small delay between transactions
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        failCount++;
        console.error(`Error buying with wallet ${wallet.name}:`, error);
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully bought tokens with ${successCount} wallets${failCount > 0 ? ` (${failCount} failed)` : ''}`);
      
      // Refresh all wallet balances
      for (const wallet of wallets) {
        handleRefreshBalance(wallet.id);
      }
    } else {
      toast.error("Failed to buy tokens with any wallet");
    }
    
    setIsLoading(false);
  };

  // Import the getBalance function at runtime to avoid circular dependencies
  const getBalance = async (publicKey: any) => {
    const { getBalance } = await import('@/lib/solana');
    return getBalance(publicKey);
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
            
            <h1 className="text-3xl font-light">Wallet Dashboard</h1>
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
              
              <Card className="mt-6 bg-black/30 border-solana/30">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CoinsIcon className="mr-2 h-5 w-5 text-solana" />
                    Buy Token by Address
                  </CardTitle>
                  <CardDescription>
                    Paste a token address to buy it directly
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-300 mb-1 block">Token Address</label>
                    <Input
                      placeholder="Paste token address..."
                      value={tokenAddress}
                      onChange={(e) => setTokenAddress(e.target.value)}
                      className="bg-black/30 border-gray-700"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-300 mb-1 block">Buy Amount (SOL)</label>
                    <Input
                      type="number"
                      step="0.001"
                      min="0.001"
                      placeholder="0.01"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(parseFloat(e.target.value) || 0)}
                      className="bg-black/30 border-gray-700"
                    />
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <Button 
                      onClick={handleBuyToken}
                      disabled={!getActiveWallet() || isLoading}
                      className="bg-solana hover:bg-solana/90"
                    >
                      {isLoading ? "Buying..." : "Buy Token"}
                    </Button>
                    
                    <Button 
                      onClick={handleBuyWithAllWallets}
                      disabled={wallets.length === 0 || isLoading}
                      variant="outline"
                      className="border-solana text-solana hover:bg-solana/10"
                    >
                      {isLoading ? "Processing..." : "Buy With All Wallets"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <div className="lg:col-span-8 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Card className="bg-black/30 border-solana/30">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart2Icon className="mr-2 h-5 w-5 text-solana" />
                      Token Chart
                    </CardTitle>
                    <CardDescription>
                      Live market data from DexScreener
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative w-full">
                      <style>
                        {`
                          #dexscreener-embed{
                            position:relative;
                            width:100%;
                            padding-bottom:125%;
                          }
                          @media(min-width:1400px){
                            #dexscreener-embed{
                              padding-bottom:65%;
                            }
                          }
                          #dexscreener-embed iframe{
                            position:absolute;
                            width:100%;
                            height:100%;
                            top:0;
                            left:0;
                            border:0;
                            border-radius: 0.5rem;
                          }
                        `}
                      </style>
                      <div id="dexscreener-embed">
                        <iframe 
                          src={tokenAddress 
                            ? `https://dexscreener.com/solana/${tokenAddress}?embed=1&loadChartSettings=0&chartDefaultOnMobile=1&chartTheme=dark&theme=dark&chartStyle=1&chartType=marketCap&interval=1S`
                            : "https://dexscreener.com/solana?embed=1&loadChartSettings=0&chartDefaultOnMobile=1&chartTheme=dark&theme=dark&chartStyle=1&chartType=marketCap&interval=1S"
                          }
                          title="DexScreener Chart"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
};

export default WalletPage;
