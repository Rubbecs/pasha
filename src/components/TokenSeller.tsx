import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CoinsIcon, 
  RefreshCwIcon, 
  SendIcon, 
  PercentIcon, 
  CircleDollarSignIcon,
  InfoIcon
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { getUserTokens, sellToken } from "@/lib/solana";
import { WalletDetails, TokenInfo, TransactionStatus, TransactionFees } from "@/types";
import TransactionStatusComponent from './TransactionStatus';
import { PublicKey } from '@solana/web3.js';

interface TokenSellerProps {
  wallet: WalletDetails | null;
}

const TokenSeller: React.FC<TokenSellerProps> = ({ wallet }) => {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [destinationAddress, setDestinationAddress] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [sellPercent, setSellPercent] = useState('');
  const [transactionFees, setTransactionFees] = useState<TransactionFees>({
    gasFee: 0.001,
    tip: 0
  });
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({
    status: 'idle',
  });

  const fetchTokens = async () => {
    if (!wallet) return;
    
    setIsLoading(true);
    try {
      const userTokens = await getUserTokens(wallet.publicKey);
      setTokens(userTokens);
      if (userTokens.length > 0 && !selectedToken) {
        setSelectedToken(userTokens[0]);
      }
    } catch (error) {
      console.error("Failed to fetch tokens:", error);
      toast.error("Failed to load tokens");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, [wallet]);

  const handleSelectToken = (token: TokenInfo) => {
    setSelectedToken(token);
    setSellAmount('');
    setSellPercent('');
  };

  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    
    setTransactionFees(prev => ({
      ...prev,
      [name]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const handleSellToken = async () => {
    if (!wallet || !selectedToken || !destinationAddress) {
      toast.error("Please select a token and enter destination address");
      return;
    }

    // Validate destination address
    try {
      new PublicKey(destinationAddress);
    } catch (error) {
      toast.error("Invalid destination address");
      return;
    }

    let amount = 0;
    if (sellAmount) {
      amount = parseFloat(sellAmount);
    } else if (sellPercent) {
      amount = (selectedToken.amount * parseFloat(sellPercent)) / 100;
    }

    if (!amount || amount <= 0 || amount > selectedToken.amount) {
      toast.error(`Please enter a valid amount between 0 and ${selectedToken.amount}`);
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

    setTransactionStatus({ status: 'pending', message: 'Selling tokens...' });

    try {
      const result = await sellToken(
        wallet.keypair,
        selectedToken.address,
        destinationAddress,
        amount,
        selectedToken.decimals,
        transactionFees
      );

      if (result.transactionId) {
        setTransactionStatus({
          status: 'success',
          message: 'Tokens sold successfully!',
          txId: result.transactionId,
        });
        toast.success('Tokens sold successfully!');
        
        // Reset form and refresh balances
        setSellAmount('');
        setSellPercent('');
        fetchTokens();
      } else {
        setTransactionStatus({
          status: 'error',
          message: result.error || 'Failed to sell tokens.',
        });
        toast.error(result.error || 'Failed to sell tokens.');
      }
    } catch (error: any) {
      console.error('Token sell error:', error);
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
            <CardTitle className="text-2xl font-light">Token Manager</CardTitle>
            <CardDescription>
              Manage and sell your Solana tokens
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchTokens} 
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
            <p className="text-gray-400">Please connect a wallet to manage your tokens</p>
          </div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-8">
            <CoinsIcon className="mx-auto h-10 w-10 text-gray-400 mb-2" />
            <p className="text-gray-400">
              {isLoading ? "Loading tokens..." : "No tokens found in this wallet"}
            </p>
          </div>
        ) : (
          <>
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {tokens.map((token) => (
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
                  <span className="font-mono">{token.amount.toFixed(2)}</span>
                  <span className="ml-1 opacity-70">
                    {token.symbol || token.address.slice(0, 4)}
                  </span>
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
                  <p className="text-lg font-light mt-1">
                    {selectedToken.amount.toFixed(6)}{" "}
                    <span className="text-sm opacity-70">
                      {selectedToken.symbol || `${selectedToken.address.slice(0, 4)}...`}
                    </span>
                  </p>
                </div>

                <Separator className="my-3" />

                <Tabs defaultValue="amount">
                  <TabsList className="w-full mb-3">
                    <TabsTrigger value="amount" className="flex-1">
                      <CircleDollarSignIcon className="h-4 w-4 mr-2" />
                      Amount
                    </TabsTrigger>
                    <TabsTrigger value="percent" className="flex-1">
                      <PercentIcon className="h-4 w-4 mr-2" />
                      Percent
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="amount" className="space-y-3">
                    <Input
                      type="number"
                      placeholder={`Amount (max: ${selectedToken.amount})`}
                      value={sellAmount}
                      onChange={(e) => {
                        setSellAmount(e.target.value);
                        setSellPercent(''); // Clear percent when amount is set
                      }}
                      className="glass-input"
                    />
                    <div className="flex space-x-2">
                      {[25, 50, 75, 100].map((percent) => (
                        <Button
                          key={percent}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSellAmount((selectedToken.amount * percent / 100).toString());
                            setSellPercent('');
                          }}
                          className="flex-1"
                        >
                          {percent}%
                        </Button>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="percent" className="space-y-3">
                    <Input
                      type="number"
                      placeholder="Percentage (1-100)"
                      value={sellPercent}
                      onChange={(e) => {
                        setSellPercent(e.target.value);
                        setSellAmount(''); // Clear amount when percent is set
                      }}
                      className="glass-input"
                      min="1"
                      max="100"
                    />
                    <div className="flex space-x-2">
                      {[25, 50, 75, 100].map((percent) => (
                        <Button
                          key={percent}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSellPercent(percent.toString());
                            setSellAmount('');
                          }}
                          className="flex-1"
                        >
                          {percent}%
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="mt-4">
                  <Input
                    placeholder="Destination Address"
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    className="glass-input mb-3"
                  />

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
                    {(transactionFees.gasFee > 0 || transactionFees.tip > 0) && (
                      <div className="mt-2 text-xs text-gray-400">
                        Total fees: {(Number(transactionFees.gasFee) + Number(transactionFees.tip)).toFixed(3)} SOL
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-solana to-solana-secondary hover:opacity-90 transition-opacity"
                    onClick={handleSellToken}
                    disabled={
                      transactionStatus.status === 'pending' ||
                      !destinationAddress ||
                      ((!sellAmount || parseFloat(sellAmount) <= 0) && 
                       (!sellPercent || parseFloat(sellPercent) <= 0))
                    }
                  >
                    {transactionStatus.status === 'pending' ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <SendIcon className="h-4 w-4" />
                        Send Tokens
                      </span>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {transactionStatus.status !== 'idle' && (
              <TransactionStatusComponent status={transactionStatus} />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TokenSeller;
