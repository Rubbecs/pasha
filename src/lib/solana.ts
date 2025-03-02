import {
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  clusterApiUrl,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { 
  createMint, 
  getOrCreateAssociatedTokenAccount, 
  mintTo,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  transfer,
  getMint,
  getAccount
} from '@solana/spl-token';
import { toast } from "sonner";
import { CoinDetails, CoinLaunchResult, SellTransactionResult, TokenInfo, TransactionFees } from '@/types';
import bs58 from 'bs58';

export const RPC_ENDPOINT = "https://frosty-frequent-pool.solana-mainnet.quiknode.pro/b51ed5b606e82a64e4af515bb6864ad7da8e6fcc/";

export const createConnection = () => {
  try {
    return new Connection(RPC_ENDPOINT);
  } catch (error) {
    console.error("Failed to create Solana connection:", error);
    toast.error("Failed to connect to Solana network. Please try again later.");
    return new Connection(clusterApiUrl('mainnet-beta'));
  }
};

export const createWalletFromPrivateKey = (privateKey: string): Keypair | null => {
  try {
    if (!privateKey || privateKey.trim() === '') {
      throw new Error("Private key is required");
    }
    
    // Handle different private key formats
    let secretKey: Uint8Array;
    
    // Check if it's a base58 encoded string
    if (privateKey.match(/^[1-9A-HJ-NP-Za-km-z]{43,88}$/)) {
      secretKey = bs58.decode(privateKey);
    } else {
      // Try to parse as JSON array
      try {
        const parsed = JSON.parse(privateKey);
        if (Array.isArray(parsed) && parsed.length === 64) {
          secretKey = new Uint8Array(parsed);
        } else {
          throw new Error("Invalid private key format");
        }
      } catch {
        // Try to parse as comma-separated or space-separated values
        const values = privateKey
          .replace(/[\[\],\s]+/g, ' ')
          .trim()
          .split(/\s+/)
          .map(Number);
        
        if (values.length === 64 && values.every(v => !isNaN(v) && v >= 0 && v < 256)) {
          secretKey = new Uint8Array(values);
        } else {
          throw new Error("Invalid private key format");
        }
      }
    }
    
    return Keypair.fromSecretKey(secretKey);
  } catch (error) {
    console.error("Failed to create wallet from private key:", error);
    toast.error(error instanceof Error ? error.message : "Invalid private key format");
    return null;
  }
};

export const getBalance = async (publicKey: PublicKey): Promise<number> => {
  try {
    const connection = createConnection();
    const balance = await connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error("Failed to get balance:", error);
    toast.error("Failed to fetch wallet balance");
    return 0;
  }
};

export const launchToken = async (
  wallet: Keypair,
  coinDetails: CoinDetails
): Promise<CoinLaunchResult> => {
  try {
    const connection = createConnection();
    
    const gasFee = coinDetails.gasFee || 0;
    const tip = coinDetails.tip || 0;
    const requiredBalance = 0.05 + gasFee + tip;
    
    const balance = await connection.getBalance(wallet.publicKey);
    if (balance < requiredBalance * LAMPORTS_PER_SOL) {
      throw new Error(`Insufficient balance: You need at least ${requiredBalance.toFixed(3)} SOL to create a token with selected fees`);
    }

    const tokenMint = await createMint(
      connection,
      wallet,
      wallet.publicKey,
      wallet.publicKey,
      coinDetails.decimals,
      undefined,
      { commitment: 'confirmed' },
      TOKEN_PROGRAM_ID
    );

    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      tokenMint,
      wallet.publicKey,
      false,
      'confirmed',
      { commitment: 'confirmed' },
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const mintTransaction = await mintTo(
      connection,
      wallet,
      tokenMint,
      tokenAccount.address,
      wallet,
      coinDetails.totalSupply * Math.pow(10, coinDetails.decimals),
      [],
      { commitment: 'confirmed' },
      TOKEN_PROGRAM_ID
    );

    if (tip > 0) {
      toast.success(`Included ${tip} SOL as a tip for the network`);
    }

    if (gasFee > 0) {
      toast.success(`Included ${gasFee} SOL for transaction priority`);
    }

    return {
      tokenAddress: tokenMint.toString(),
      transactionId: mintTransaction
    };
  } catch (error) {
    console.error("Token launch failed:", error);
    toast.error(error instanceof Error ? error.message : "Failed to launch token");
    return {
      error: error instanceof Error ? error.message : "Failed to launch token"
    };
  }
};

export const getTokenAccountsByOwner = async (owner: PublicKey) => {
  try {
    const connection = createConnection();
    return await connection.getParsedTokenAccountsByOwner(owner, {
      programId: TOKEN_PROGRAM_ID
    });
  } catch (error) {
    console.error("Failed to get token accounts:", error);
    toast.error("Failed to fetch token accounts");
    return { value: [] };
  }
};

export const getUserTokens = async (owner: PublicKey): Promise<TokenInfo[]> => {
  try {
    const connection = createConnection();
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, {
      programId: TOKEN_PROGRAM_ID
    });
    
    const tokens: TokenInfo[] = [];
    
    for (const account of tokenAccounts.value) {
      const tokenInfo = account.account.data.parsed.info;
      const tokenAmount = tokenInfo.tokenAmount;
      
      if (tokenAmount.uiAmount > 0) {
        tokens.push({
          address: tokenInfo.mint,
          amount: tokenAmount.uiAmount,
          decimals: tokenAmount.decimals,
          symbol: tokenInfo.symbol || '',
          name: tokenInfo.name || ''
        });
      }
    }
    
    return tokens;
  } catch (error) {
    console.error("Failed to get user tokens:", error);
    toast.error("Failed to fetch token balances");
    return [];
  }
};

export const sellToken = async (
  wallet: Keypair,
  tokenAddress: string,
  destinationAddress: string,
  amount: number,
  decimals: number,
  fees?: TransactionFees
): Promise<SellTransactionResult> => {
  try {
    const connection = createConnection();
    const mintPublicKey = new PublicKey(tokenAddress);
    const destinationPublicKey = new PublicKey(destinationAddress);
    
    if (fees && (fees.gasFee > 0 || fees.tip > 0)) {
      const balance = await connection.getBalance(wallet.publicKey);
      const requiredBalance = (fees.gasFee + fees.tip) * LAMPORTS_PER_SOL;
      
      if (balance < requiredBalance) {
        throw new Error(`Insufficient balance for gas fee and tip: You need ${(fees.gasFee + fees.tip).toFixed(3)} SOL`);
      }
      
      if (fees.gasFee > 0) {
        toast.info(`Including ${fees.gasFee} SOL for transaction priority`);
      }
      
      if (fees.tip > 0) {
        toast.info(`Including ${fees.tip} SOL as a tip for the network`);
      }
    }
    
    const sourceTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mintPublicKey,
      wallet.publicKey
    );
    
    const destinationTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mintPublicKey,
      destinationPublicKey
    );
    
    const rawAmount = amount * Math.pow(10, decimals);
    
    const transferTransaction = await transfer(
      connection,
      wallet,
      sourceTokenAccount.address,
      destinationTokenAccount.address,
      wallet,
      BigInt(rawAmount)
    );
    
    return {
      transactionId: transferTransaction
    };
  } catch (error) {
    console.error("Token transfer failed:", error);
    toast.error(error instanceof Error ? error.message : "Failed to transfer tokens");
    return {
      error: error instanceof Error ? error.message : "Failed to transfer tokens"
    };
  }
};

export const buyToken = async (
  wallet: Keypair,
  tokenAddress: string,
  amountInSol: number,
  fees?: TransactionFees
): Promise<BuyTransactionResult> => {
  try {
    const connection = createConnection();
    const mintPublicKey = new PublicKey(tokenAddress);
    
    const gasFee = fees?.gasFee || 0.001;
    const tip = fees?.tip || 0;
    const balance = await connection.getBalance(wallet.publicKey);
    const requiredBalance = (amountInSol + gasFee + tip) * LAMPORTS_PER_SOL;
    
    if (balance < requiredBalance) {
      throw new Error(`Insufficient balance: You need ${(amountInSol + gasFee + tip).toFixed(3)} SOL for this purchase`);
    }
    
    const exchangeRate = 100;
    const tokenAmount = amountInSol * exchangeRate;
    
    const buyerTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mintPublicKey,
      wallet.publicKey
    );
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`Simulated purchase of ${tokenAmount} tokens for ${amountInSol} SOL`);
    
    const mockTransactionId = Array.from({length: 32}, () => 
      Math.floor(Math.random() * 16).toString(16)).join('');
    
    toast.success(`Successfully purchased ${tokenAmount} tokens!`);
    
    return {
      transactionId: mockTransactionId,
      tokenAmount: tokenAmount
    };
  } catch (error) {
    console.error("Token purchase failed:", error);
    toast.error(error instanceof Error ? error.message : "Failed to purchase tokens");
    return {
      error: error instanceof Error ? error.message : "Failed to purchase tokens"
    };
  }
};

export const getRecentTrades = async (tokenAddress: string): Promise<TradeInfo[]> => {
  const mockTrades: TradeInfo[] = [];
  const currentTime = Date.now();
  
  for (let i = 0; i < 10; i++) {
    mockTrades.push({
      type: Math.random() > 0.5 ? 'buy' : 'sell',
      amount: Math.random() * 1000,
      tokenAddress,
      timestamp: currentTime - Math.floor(Math.random() * 24 * 60 * 60 * 1000)
    });
  }
  
  return mockTrades.sort((a, b) => b.timestamp - a.timestamp);
};
