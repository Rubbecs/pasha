
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CoinsIcon, 
  RefreshCwIcon, 
  ArrowDownIcon,
  ArrowUpIcon, 
  PercentIcon, 
  CircleDollarSignIcon,
  InfoIcon,
  HistoryIcon
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion } from "framer-motion";
import { toast } from "sonner";
import { getUserTokens, buyToken, getRecentTrades } from "@/lib/solana";
import { WalletDetails, TokenInfo, TransactionStatus, TransactionFees, TradeInfo } from "@/types";
import TransactionStatusComponent from './TransactionStatus';
import { format } from 'date-fns';

interface TokenExchangeProps {
  wallet: WalletDetails | null;
  launchedTokens?: TokenInfo[];
}

const TokenExchange: React.FC<TokenExchangeProps> = ({ wallet, launchedTokens = [] }) => {
  const [availableTokens, setAvailableTokens] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [buyAmount, setBuyAmount] = useState('');
  const [solAmount, setSolAmount] = useState('');
  const [transactionFees, setTransactionFees] = useState<TransactionFees>({
    gasFee: 0.001,
    tip: 0
  });
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({
    status: 'idle',
  });
  const [recentTrades, setRecentTrades] = useState<TradeInfo[]>([]);
  const [exchangeMode, setExchangeMode] = useState<'buy' | 'sell'>('buy');

  // Exchange rate - in a real app, this would come from an exchange API
  const exchangeRate = 100; // 100 tokens per SOL

  const fetchAvailableTokens = async () => {
    setIsLoading(true);
    try {
      // In a real application, you would fetch available tokens from an exchange
      // For this demo, we'll use launched tokens + any tokens the wallet already has
      const userTokens = wallet ? await getUserTokens(wallet.publicKey) : [];
      
      // Combine with launched tokens and remove duplicates
      const combinedTokens = [...userTokens];
      
      for (const launchedToken of launchedTokens) {
        if (!combinedTokens.some(token => token.address === launchedToken.address)) {
          combinedTokens.push(launchedToken);
        }
      }
      
      setAvailableTokens(combinedTokens);
      
      if (combinedTokens.length > 0 && !selectedToken) {
        setSelectedToken(combinedTokens[0]);
        fetchRecentTrades(combinedTokens[0].address);
      }
    } catch (error) {
      console.error("Failed to fetch available tokens:", error);
      toast.error("Failed to load available tokens");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentTrades = async (tokenAddress: string) => {
    try {
      const trades = await getRecentTrades(tokenAddress);
      setRecentTrades(trades);
    } catch (error) {
      console.error("Failed to fetch recent trades:", error);
    }
  };

  useEffect(() => {
    fetchAvailableTokens();
  }, [wallet, launchedTokens]);

  const handleSelectToken = (token: TokenInfo) => {
    setSelectedToken(token);
    setBuyAmount('');
    setSolAmount('');
    fetchRecentTrades(token.address);
  };

  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    
    setTransactionFees(prev => ({
      ...prev,
      [name]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const handleBuyAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBuyAmount(value);
    
    // Calculate equivalent SOL amount
    if (value && !isNaN(parseFloat(value))) {
      const sol = parseFloat(value) / exchangeRate;
      setSolAmount(sol.toFixed(4));
    } else {
      setSolAmount('');
    }
  };

  const handleSolAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSolAmount(value);
    
    // Calculate equivalent token amount
    if (value && !isNaN(parseFloat(value))) {
      const tokens = parseFloat(value) * exchangeRate;
      setBuyAmount(tokens.toFixed(2));
    } else {
      setBuyAmount('');
    }
  };

  const handleBuyToken = async () => {
    if (!wallet || !selectedToken || !solAmount) {
      toast.error("Please enter an amount to buy");
      return;
    }

    const solValue = parseFloat(solAmount);
    if (isNaN(solValue) || solValue <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Validate fees
    if (transactionFees.gasFee < 0) {
      toast.error("Gas fee cannot be negative");
      return;
    }
    
    if (transactionFees.tip < 0) {
      toast.error("Tip cannot be negative");
      return;
    }

    setTransactionStatus({ status: 'pending', message: 'Processing purchase...' });

    try {
      const result = await buyToken(
        wallet.keypair,
        selectedToken.address,
        solValue,
        transactionFees
      );

      if (result.transactionId) {
        setTransactionStatus({
          status: 'success',
          message: `Successfully purchased ${result.tokenAmount?.toFixed(2) || buyAmount} tokens!`,
          txId: result.transactionId,
        });
        toast.success('Purchase successful!');
        
        // Reset form and refresh balances
        setBuyAmount('');
        setSolAmount('');
        fetchAvailableTokens();
        fetchRecentTrades(selectedToken.address);
      } else {
        setTransactionStatus({
          status: 'error',
          message: result.error || 'Failed to buy tokens.',
        });
        toast.error(result.error || 'Failed to buy tokens.');
      }
    } catch (error: any) {
      console.error('Token purchase error:', error);
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
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-light">Token Exchange</CardTitle>
            <CardDescription>
              Buy and sell tokens on the Solana blockchain
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAvailableTokens} 
            disabled={isLoading || !wallet}
          >
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!wallet ? (
          <div className="text-center py-8">
            <CoinsIcon className="mx-auto h-10 w-10 text-gray-400 mb-2" />
            <p className="text-gray-400">Please connect a wallet to use the exchange</p>
          </div>
        ) : availableTokens.length === 0 ? (
          <div className="text-center py-8">
            <CoinsIcon className="mx-auto h-10 w-10 text-gray-400 mb-2" />
            <p className="text-gray-400">
              {isLoading ? "Loading tokens..." : "No tokens available for trading"}
            </p>
            {!isLoading && (
              <p className="text-sm text-gray-500 mt-2">
                Launch a token first or connect a wallet with existing tokens
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {availableTokens.map((token) => (
                <Button
                  key={token.address}
                  variant={selectedToken?.address === token.address ? "default" : "outline"}
                  className={`flex-shrink-0 ${
                    selectedToken?.address === token.address
                      ? "bg-gradient-to-r from-solana to-solana-secondary"
                      : ""
                  }`}
                  onClick={() => handleSelectToken(token)}
                >
                  <span className="font-mono">{token.symbol || token.address.slice(0, 4)}</span>
                </Button>
              ))}
            </div>

            {selectedToken && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="p-4 rounded-lg bg-black/20"
              >
                <div className="mb-3">
                  <h3 className="font-medium">Selected Token</h3>
                  <p className="text-xs text-gray-400 font-mono truncate">{selectedToken.address}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-lg font-light">
                      {selectedToken.symbol || `${selectedToken.address.slice(0, 4)}...`}
                    </p>
                    <p className="text-sm opacity-70">
                      Rate: 1 SOL = {exchangeRate} tokens
                    </p>
                  </div>
                </div>

                <Separator className="my-3" />

                <Tabs defaultValue="buy" value={exchangeMode} onValueChange={(v) => setExchangeMode(v as 'buy' | 'sell')}>
                  <TabsList className="w-full mb-3">
                    <TabsTrigger value="buy" className="flex-1">
                      <ArrowDownIcon className="h-4 w-4 mr-2" />
                      Buy
                    </TabsTrigger>
                    <TabsTrigger value="sell" className="flex-1">
                      <ArrowUpIcon className="h-4 w-4 mr-2" />
                      Sell
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="buy" className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-300">Token Amount</label>
                      <Input
                        type="number"
                        placeholder="Amount of tokens to buy"
                        value={buyAmount}
                        onChange={handleBuyAmountChange}
                        className="glass-input"
                      />
                    </div>

                    <div className="flex items-center justify-center my-2">
                      <div className="bg-gray-800 p-1 rounded-full">
                        <ArrowDownIcon className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-gray-300">SOL Amount</label>
                      <Input
                        type="number"
                        placeholder="Amount in SOL"
                        value={solAmount}
                        onChange={handleSolAmountChange}
                        className="glass-input"
                      />
                    </div>

                    <div className="mb-3">
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
                            value={transactionFees.gasFee}
                            onChange={handleFeeChange}
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
                            value={transactionFees.tip}
                            onChange={handleFeeChange}
                            className="glass-input"
                            step="0.001"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>

                    {(solAmount && parseFloat(solAmount) > 0) && (
                      <Alert className="bg-black/20 border-solana/20">
                        <InfoIcon className="h-4 w-4 text-solana" />
                        <AlertTitle>Transaction Summary</AlertTitle>
                        <AlertDescription className="text-sm">
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between">
                              <span>Tokens:</span>
                              <span className="font-mono">{parseFloat(buyAmount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Price:</span>
                              <span className="font-mono">{parseFloat(solAmount).toFixed(4)} SOL</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Fees:</span>
                              <span className="font-mono">{(transactionFees.gasFee + transactionFees.tip).toFixed(4)} SOL</span>
                            </div>
                            <Separator className="my-1" />
                            <div className="flex justify-between font-medium">
                              <span>Total:</span>
                              <span className="font-mono">{(parseFloat(solAmount) + transactionFees.gasFee + transactionFees.tip).toFixed(4)} SOL</span>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button
                      className="w-full bg-gradient-to-r from-solana to-solana-secondary hover:opacity-90 transition-opacity"
                      onClick={handleBuyToken}
                      disabled={
                        transactionStatus.status === 'pending' ||
                        !solAmount ||
                        parseFloat(solAmount) <= 0
                      }
                    >
                      {transactionStatus.status === 'pending' ? (
                        <span className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <ArrowDownIcon className="h-4 w-4" />
                          Buy Tokens
                        </span>
                      )}
                    </Button>
                  </TabsContent>

                  <TabsContent value="sell" className="space-y-3">
                    <div className="text-center py-4">
                      <p className="text-gray-400">
                        To sell tokens, please use the Token Manager section below
                      </p>
                      <Button
                        variant="outline"
                        className="mt-2"
                        onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                      >
                        Go to Token Manager
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}

            {transactionStatus.status !== 'idle' && (
              <TransactionStatusComponent status={transactionStatus} />
            )}

            {selectedToken && recentTrades.length > 0 && (
              <div className="mt-4 p-4 rounded-lg bg-black/20">
                <div className="flex items-center mb-3">
                  <HistoryIcon className="h-4 w-4 mr-2 text-solana" />
                  <h3 className="font-medium">Recent Trades</h3>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {recentTrades.map((trade, index) => (
                    <div key={index} className="flex justify-between text-sm p-2 rounded bg-black/20">
                      <div className="flex items-center">
                        {trade.type === 'buy' ? (
                          <ArrowDownIcon className="h-3 w-3 mr-1 text-green-500" />
                        ) : (
                          <ArrowUpIcon className="h-3 w-3 mr-1 text-red-500" />
                        )}
                        <span className="capitalize">{trade.type}</span>
                      </div>
                      <div className="font-mono">{trade.amount.toFixed(2)}</div>
                      <div className="text-gray-400">{format(new Date(trade.timestamp), 'HH:mm:ss')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TokenExchange;
