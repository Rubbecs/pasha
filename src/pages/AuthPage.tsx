
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LockIcon, UnlockIcon, WalletIcon, UserIcon, MailIcon, KeyIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const AuthPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/');
      }
    };
    
    checkSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          navigate('/');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !username.trim()) {
      toast.error('Please fill in all fields');
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
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data) {
        toast.success('Account created successfully! Please check your email for verification.');
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter your email and password');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        toast.success('Signed in successfully!');
        navigate('/');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-12 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="glass-panel border-solana/30">
            <CardHeader>
              <CardTitle className="text-2xl font-light flex items-center">
                <WalletIcon className="mr-2 h-5 w-5 text-solana" />
                Solana Bundlr
              </CardTitle>
              <CardDescription>
                Create an account or sign in to manage your wallets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="register">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <MailIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <label htmlFor="email" className="text-sm text-gray-400">Email</label>
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="glass-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <KeyIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <label htmlFor="password" className="text-sm text-gray-400">Password</label>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="glass-input"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleSignIn} 
                    className="w-full bg-gradient-to-r from-solana to-solana-secondary hover:opacity-90 transition-opacity"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Signing in...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        Sign In
                      </span>
                    )}
                  </Button>
                  
                  <p className="text-sm text-center text-gray-400 mt-4">
                    Don't have an account?{' '}
                    <button
                      onClick={() => setActiveTab('register')}
                      className="text-solana hover:underline"
                    >
                      Sign Up
                    </button>
                  </p>
                </TabsContent>
                
                <TabsContent value="register" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <label htmlFor="username" className="text-sm text-gray-400">Username</label>
                    </div>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="glass-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <MailIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <label htmlFor="register-email" className="text-sm text-gray-400">Email</label>
                    </div>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="glass-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <KeyIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <label htmlFor="register-password" className="text-sm text-gray-400">Password</label>
                    </div>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="glass-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <LockIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <label htmlFor="confirm-password" className="text-sm text-gray-400">Confirm Password</label>
                    </div>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="glass-input"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleSignUp} 
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
                        Sign Up
                      </span>
                    )}
                  </Button>
                  
                  <p className="text-sm text-center text-gray-400 mt-4">
                    Already have an account?{' '}
                    <button
                      onClick={() => setActiveTab('login')}
                      className="text-solana hover:underline"
                    >
                      Sign In
                    </button>
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AuthPage;
