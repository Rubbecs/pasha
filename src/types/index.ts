
import { PublicKey } from '@solana/web3.js';

export interface WalletInfo {
  publicKey: PublicKey | null;
  connected: boolean;
}

export interface CoinDetails {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  description?: string;
  imageUrl?: string;
}

export interface TransactionStatus {
  status: 'idle' | 'pending' | 'success' | 'error';
  message?: string;
  txId?: string;
}

export interface CoinLaunchResult {
  tokenAddress?: string;
  transactionId?: string;
  error?: string;
}
