
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
  gasFee?: number;
  tip?: number;
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

export interface BuyTransactionResult {
  transactionId?: string;
  error?: string;
  tokenAmount?: number;
}

export interface TransactionFees {
  gasFee: number;
  tip: number;
}

export interface ExchangeRates {
  [tokenAddress: string]: number; // SOL per token
}

export interface TradeInfo {
  type: 'buy' | 'sell';
  amount: number;
  tokenAddress: string;
  timestamp: number;
}
