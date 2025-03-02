
import { PublicKey, Keypair } from '@solana/web3.js';

export interface WalletInfo {
  publicKey: PublicKey | null;
  connected: boolean;
  activeWalletIndex?: number;
}

export interface WalletDetails {
  id: string;
  keypair: Keypair;
  publicKey: PublicKey;
  name: string;
  balance: number;
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

export interface TokenInfo {
  address: string;
  amount: number;
  decimals: number;
  symbol?: string;
  name?: string;
}

export interface SellTransactionResult {
  transactionId?: string;
  error?: string;
}
