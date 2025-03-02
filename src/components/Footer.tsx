
import React from 'react';
import { motion } from 'framer-motion';

const Footer: React.FC = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="w-full py-6 px-4 sm:px-6 lg:px-8 backdrop-blur-sm border-t border-white/10 mt-12"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-sm font-medium mb-4">About Solana Bundlr</h3>
            <p className="text-xs text-muted-foreground">
              A minimalist application for creating and launching tokens on the Solana blockchain.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://solana.com/docs" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Solana Documentation
                </a>
              </li>
              <li>
                <a 
                  href="https://spl.solana.com/token" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  SPL Token Program
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-4">Connect</h3>
            <div className="flex space-x-4">
              <a 
                href="https://twitter.com/solana" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Twitter
              </a>
              <a 
                href="https://discord.com/invite/solana" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Discord
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-8 border-t border-white/5 pt-4">
          <p className="text-xs text-center text-muted-foreground">
            &copy; {new Date().getFullYear()} Solana Bundlr. All rights reserved.
          </p>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
