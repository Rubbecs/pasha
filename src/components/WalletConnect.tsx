
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LockIcon, 
  UnlockIcon, 
  WalletIcon, 
  CopyIcon, 
  CheckIcon, 
  PlusIcon, 
  Trash2Icon,
  RefreshCwIcon,
  ChevronsUpDownIcon
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { createWalletFromPrivateKey, getBalance } from '@/lib/solana';
import { WalletDetails, WalletInfo } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface WalletConnectProps {
  onWalletConnect: (wallet: any, index: number) => void;
  walletInfo: WalletInfo;
  wallets: WalletDetails[];
  onAddWallet: (wallet: WalletDetails) => void;
  onRemoveWallet: (id: string) => void;
  onSwitchWallet: (index: number) => void;
  onRefreshBalance: (id: string) => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ 
  onWalletConnect, 
  walletInfo, 
  wallets,
  onAddWallet,
  onRemoveWallet,
  onSwitchWallet,
  onRefreshBalance
}) => {
  const [privateKey, setPrivateKey] = useState('');
  const [walletName, setWalletName] = useState('');
  const [maskedPrivateKey, setMaskedPrivateKey] = useState('');
  const [isPrivateKeyVisible, setIsPrivateKeyVisible] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      const keypair = createWalletFromPrivateKey(privateKey);
      
      if (keypair) {
        const walletBalance = await getBalance(keypair.publicKey);
        const walletId = uuidv4();
        const newWallet: WalletDetails = {
          id: walletId,
          keypair: keypair,
          publicKey: keypair.publicKey,
          name: walletName || `Wallet ${wallets.length + 1}`,
          balance: walletBalance
        };
        
        onAddWallet(newWallet);
        onWalletConnect(keypair, wallets.length);
        
        // Reset form
        setPrivateKey('');
        setWalletName('');
        
        toast.success('Wallet added successfully');
      } else {
        toast.error('Failed to add wallet');
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      toast.error('Failed to add wallet: Invalid private key');
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
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-light">Wallets</CardTitle>
            <CardDescription>
              Manage your Solana wallets
            </CardDescription>
          </div>
          {wallets.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ChevronsUpDownIcon className="h-4 w-4 mr-2" />
                  {wallets.length === 1 ? '1 Wallet' : `${wallets.length} Wallets`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {wallets.map((wallet, index) => (
                  <DropdownMenuItem
                    key={wallet.id}
                    className={walletInfo.activeWalletIndex === index ? "bg-secondary" : ""}
                    onClick={() => onSwitchWallet(index)}
                  >
                    {wallet.name} 
                    <span className="ml-2 text-xs opacity-70">
                      ({wallet.publicKey.toString().slice(0, 4)}...{wallet.publicKey.toString().slice(-4)})
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={wallets.length > 0 ? "manage" : "add"}>
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="add" className="flex-1">Add Wallet</TabsTrigger>
            <TabsTrigger value="manage" className="flex-1" disabled={wallets.length === 0}>Manage Wallets</TabsTrigger>
          </TabsList>
          
          <TabsContent value="add" className="space-y-4">
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Wallet Name (optional)"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                className="glass-input"
              />
              <div className="relative">
                <Input
                  type={isPrivateKeyVisible ? 'text' : 'password'}
                  placeholder="Enter private key"
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
                    Adding Wallet...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <PlusIcon className="h-4 w-4" />
                    Add Wallet
                  </span>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="manage">
            <AnimatePresence>
              {wallets.length > 0 ? (
                <div className="space-y-3">
                  {wallets.map((wallet, index) => (
                    <motion.div
                      key={wallet.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                      className={`p-3 rounded-lg border ${
                        walletInfo.activeWalletIndex === index
                          ? "border-solana/50 bg-gradient-to-r from-solana/10 to-transparent"
                          : "border-gray-700 hover:border-gray-600"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{wallet.name}</p>
                          <div className="flex items-center mt-1">
                            <span className="text-xs font-mono text-gray-400 truncate max-w-[150px]">
                              {wallet.publicKey.toString().slice(0, 8)}...
                              {wallet.publicKey.toString().slice(-8)}
                            </span>
                            <button
                              onClick={() => copyToClipboard(wallet.publicKey.toString())}
                              className="ml-1 text-gray-400 hover:text-white transition-colors"
                            >
                              <CopyIcon className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="mt-2 text-sm font-medium">
                            {wallet.balance?.toFixed(4)} <span className="text-xs text-solana-secondary">SOL</span>
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => onRefreshBalance(wallet.id)}
                          >
                            <RefreshCwIcon className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => onRemoveWallet(wallet.id)}
                          >
                            <Trash2Icon className="h-3.5 w-3.5" />
                          </Button>
                          {walletInfo.activeWalletIndex !== index && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => onSwitchWallet(index)}
                            >
                              Use
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400">No wallets added yet</p>
                  <Button
                    variant="link"
                    className="mt-2 text-solana-secondary"
                    onClick={() => {
                      const addTab = document.querySelector('[data-value="add"]') as HTMLElement;
                      if (addTab) addTab.click();
                    }}
                  >
                    Add your first wallet
                  </Button>
                </div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default WalletConnect;
