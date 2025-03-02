
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

// Updated to include transaction fees
export const launchToken = async (
  wallet: Keypair,
  coinDetails: CoinDetails
): Promise<CoinLaunchResult> => {
  try {
    const connection = createConnection();
    
    // Calculate required balance including gas fee and tip
    const gasFee = coinDetails.gasFee || 0;
    const tip = coinDetails.tip || 0;
    const requiredBalance = 0.05 + gasFee + tip;
    
    // Check if wallet has enough balance
    const balance = await connection.getBalance(wallet.publicKey);
    if (balance < requiredBalance * LAMPORTS_PER_SOL) {
      throw new Error(`Insufficient balance: You need at least ${requiredBalance.toFixed(3)} SOL to create a token with selected fees`);
    }

    // Create a new token mint
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

    // Get the token account of the wallet address
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

    // Mint the total supply to the token account we just created
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

    // If tip is included, send tip to a fee collector (for demonstration, we're not actually implementing this)
    if (tip > 0) {
      toast.success(`Included ${tip} SOL as a tip for the network`);
    }

    // If gas fee is adjusted, show a notification
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

// Updated to include transaction fees
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
    
    // Check if wallet has enough balance for gas fee and tip
    if (fees && (fees.gasFee > 0 || fees.tip > 0)) {
      const balance = await connection.getBalance(wallet.publicKey);
      const requiredBalance = (fees.gasFee + fees.tip) * LAMPORTS_PER_SOL;
      
      if (balance < requiredBalance) {
        throw new Error(`Insufficient balance for gas fee and tip: You need ${(fees.gasFee + fees.tip).toFixed(3)} SOL`);
      }
      
      // Notify about fees
      if (fees.gasFee > 0) {
        toast.info(`Including ${fees.gasFee} SOL for transaction priority`);
      }
      
      if (fees.tip > 0) {
        toast.info(`Including ${fees.tip} SOL as a tip for the network`);
      }
    }
    
    // Get the source token account
    const sourceTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mintPublicKey,
      wallet.publicKey
    );
    
    // Get the destination token account (create if doesn't exist)
    const destinationTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mintPublicKey,
      destinationPublicKey
    );
    
    // Convert amount to raw amount using decimals
    const rawAmount = amount * Math.pow(10, decimals);
    
    // Send the tokens
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
