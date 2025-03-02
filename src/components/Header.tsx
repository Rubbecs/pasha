
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Header: React.FC = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full py-6 px-4 sm:px-6 lg:px-8 backdrop-blur-sm border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-tr from-solana to-solana-secondary rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">SB</span>
          </div>
          <h1 className="text-xl font-medium">Solana Bundlr</h1>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-sm font-medium hover:text-solana transition-colors">
            Home
          </Link>
          <Link to="/wallet" className="text-sm font-medium hover:text-solana transition-colors">
            Wallet
          </Link>
          <Link to="/tokens" className="text-sm font-medium hover:text-solana transition-colors">
            My Tokens
          </Link>
        </nav>
        
        <div className="flex items-center">
          <a 
            href="https://solana.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Powered by Solana
          </a>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
