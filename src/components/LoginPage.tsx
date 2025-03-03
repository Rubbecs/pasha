
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LockIcon, UnlockIcon, WalletIcon, KeyIcon, LogInIcon, UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { createWalletFromPrivateKey, getBalance } from '@/lib/solana';
import { WalletDetails, WalletInfo } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface LoginPageProps {
  onWalletConnect: (wallet: any, index: number) => void;
  onAddWallet: (wallet: WalletDetails) => void;
  wallets: WalletDetails[];
  onLoginComplete: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ 
  onWalletConnect, 
  onAddWallet, 
  wallets,
  onLoginComplete 
}) => {
  const [privateKey, setPrivateKey] = useState('');
  const [walletName, setWalletName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isPrivateKeyVisible, setIsPrivateKeyVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [hasStoredWallets, setHasStoredWallets] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    // Check if there are stored wallets
    const storedProfile = localStorage.getItem('solanaBundlrProfile');
    if (storedProfile) {
      try {
        const profile = JSON.parse(storedProfile);
        if (profile.username) {
          setUsername(profile.username);
          setHasStoredWallets(true);
        }
      } catch (error) {
        console.error('Failed to parse stored profile:', error);
      }
    }
  }, []);

  const handleCreateAccount = async () => {
    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    
    try {
      const encryptedProfile = {
        username: username,
        walletsCreated: 0,
        created: new Date().toISOString()
      };
      
      localStorage.setItem('solanaBundlrProfile', JSON.stringify(encryptedProfile));
      
      // Create a default wallet if a private key is provided
      if (privateKey) {
        await handleAddWallet();
      }
      
      toast.success('Account created successfully!');
      onLoginComplete();
    } catch (error) {
      console.error('Account creation error:', error);
      toast.error('Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    if (!password.trim()) {
      toast.error('Please enter a password');
      return;
    }

    setIsLoading(true);
    
    try {
      const storedProfile = localStorage.getItem('solanaBundlrProfile');
      
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        
        if (profile.username === username) {
          // In a real app, we'd verify the password against a hashed version
          // For this demo, we'll just assume the password is correct
          
          // Load wallets if any
          const storedWallets = localStorage.getItem('solanaBundlrWallets');
          if (storedWallets) {
            try {
              const walletsData = JSON.parse(storedWallets);
              
              // We need to recreate the keypairs as they don't survive JSON serialization
              for (const wallet of walletsData) {
                if (wallet.privateKey) {
                  const keypair = createWalletFromPrivateKey(wallet.privateKey);
                  const walletBalance = await getBalance(keypair.publicKey);
                  
                  const restoredWallet: WalletDetails = {
                    id: wallet.id,
                    keypair: keypair,
                    publicKey: keypair.publicKey,
                    name: wallet.name,
                    balance: walletBalance
                  };
                  
                  onAddWallet(restoredWallet);
                }
              }
              
              toast.success(`Welcome back, ${username}!`);
              onLoginComplete();
            } catch (error) {
              console.error('Error restoring wallets:', error);
              toast.error('Failed to restore wallets');
            }
          } else {
            toast.success(`Welcome back, ${username}!`);
            onLoginComplete();
          }
        } else {
          toast.error('Invalid username or password');
        }
      } else {
        toast.error('User not found');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWallet = async () => {
    if (!privateKey) {
      toast.error('Please enter a private key');
      return;
    }
    
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
        
        // If rememberMe is checked, store the wallet info
        if (rememberMe) {
          const storedWallets = localStorage.getItem('solanaBundlrWallets');
          let walletsToStore = [];
          
          if (storedWallets) {
            walletsToStore = JSON.parse(storedWallets);
          }
          
          // We can't store the keypair directly as it contains non-serializable data
          // Instead, store the private key
          walletsToStore.push({
            id: walletId,
            privateKey: privateKey,
            publicKeyStr: keypair.publicKey.toString(),
            name: newWallet.name
          });
          
          localStorage.setItem('solanaBundlrWallets', JSON.stringify(walletsToStore));
        }
        
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

  const handleContinueWithStoredWallets = async () => {
    if (!password.trim()) {
      toast.error('Please enter your password');
      return;
    }

    setIsLoading(true);
    
    try {
      // In a real app, we'd verify the password
      // For now, we'll just try to load the wallets
      
      const storedWallets = localStorage.getItem('solanaBundlrWallets');
      if (storedWallets) {
        try {
          const walletsData = JSON.parse(storedWallets);
          
          // Recreate the keypairs as they don't survive JSON serialization
          for (const wallet of walletsData) {
            if (wallet.privateKey) {
              const keypair = createWalletFromPrivateKey(wallet.privateKey);
              const walletBalance = await getBalance(keypair.publicKey);
              
              const restoredWallet: WalletDetails = {
                id: wallet.id,
                keypair: keypair,
                publicKey: keypair.publicKey,
                name: wallet.name,
                balance: walletBalance
              };
              
              onAddWallet(restoredWallet);
            }
          }
          
          toast.success(`Welcome back, ${username}!`);
          onLoginComplete();
        } catch (error) {
          console.error('Error restoring wallets:', error);
          toast.error('Failed to restore wallets');
        }
      } else {
        toast.error('No stored wallets found');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="glass-panel border-solana/30">
        <CardHeader>
          <CardTitle className="text-2xl font-light flex items-center">
            <WalletIcon className="mr-2 h-5 w-5 text-solana" />
            Solana Bundlr
          </CardTitle>
          <CardDescription>
            {hasStoredWallets ? 'Welcome back! Log in to access your wallets' : 'Create an account or login to manage your wallets'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasStoredWallets ? (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium">{username}</h3>
                <p className="text-sm text-gray-400">Enter your password to continue</p>
              </div>
              
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input"
              />
              
              <Button 
                onClick={handleContinueWithStoredWallets} 
                className="w-full bg-gradient-to-r from-solana to-solana-secondary hover:opacity-90 transition-opacity"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Loading...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogInIcon className="h-4 w-4" />
                    Login
                  </span>
                )}
              </Button>
              
              <div className="text-center mt-4">
                <Button
                  variant="link"
                  onClick={() => {
                    localStorage.removeItem('solanaBundlrProfile');
                    localStorage.removeItem('solanaBundlrWallets');
                    setHasStoredWallets(false);
                    setUsername('');
                    setPassword('');
                  }}
                  className="text-sm text-gray-400"
                >
                  Not you? Clear stored data
                </Button>
              </div>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                <Input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="glass-input"
                />
                
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input"
                />
                
                <Button 
                  onClick={handleLogin} 
                  className="w-full bg-gradient-to-r from-solana to-solana-secondary hover:opacity-90 transition-opacity"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Logging in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <LogInIcon className="h-4 w-4" />
                      Login
                    </span>
                  )}
                </Button>
                
                <p className="text-sm text-center text-gray-400 mt-4">
                  Don't have an account?{' '}
                  <button
                    onClick={() => setActiveTab('register')}
                    className="text-solana hover:underline"
                  >
                    Register
                  </button>
                </p>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4">
                <Input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="glass-input"
                />
                
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input"
                />
                
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="glass-input"
                />
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-300">Add your first wallet (optional)</p>
                  
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
                      placeholder="Enter private key (optional)"
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
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="rememberWallet"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-solana focus:ring-solana"
                    />
                    <label htmlFor="rememberWallet" className="ml-2 block text-sm text-gray-300">
                      Remember my wallets for next login
                    </label>
                  </div>
                </div>
                
                <Button 
                  onClick={handleCreateAccount} 
                  className="w-full bg-gradient-to-r from-solana to-solana-secondary hover:opacity-90 transition-opacity"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Creating Account...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      Create Account
                    </span>
                  )}
                </Button>
                
                <p className="text-sm text-center text-gray-400 mt-4">
                  Already have an account?{' '}
                  <button
                    onClick={() => setActiveTab('login')}
                    className="text-solana hover:underline"
                  >
                    Login
                  </button>
                </p>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LoginPage;
