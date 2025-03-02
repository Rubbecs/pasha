
import { CoinDetails } from "@/types";
import { createConnection, getTokenAccountsByOwner } from "./solana";
import { PublicKey } from "@solana/web3.js";
import { toast } from "sonner";

export interface BundlrMetadata {
  name: string;
  symbol: string;
  description: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
}

export const storeCoinMetadata = async (
  wallet: any,
  coinDetails: CoinDetails,
  tokenAddress: string
): Promise<string | null> => {
  try {
    // In a real implementation, we would use Bundlr to store metadata
    // For this demo, we'll just return a mock URL
    
    const metadata: BundlrMetadata = {
      name: coinDetails.name,
      symbol: coinDetails.symbol,
      description: coinDetails.description || `${coinDetails.name} token`,
      image: coinDetails.imageUrl,
      attributes: [
        { trait_type: "Decimals", value: coinDetails.decimals },
        { trait_type: "Total Supply", value: coinDetails.totalSupply }
      ]
    };
    
    // Mock successful storage
    console.log("Metadata stored:", metadata);
    
    return `https://arweave.net/${Math.random().toString(36).substring(2, 15)}`;
  } catch (error) {
    console.error("Failed to store metadata:", error);
    toast.error("Failed to store token metadata");
    return null;
  }
};

export const getUserTokens = async (publicKey: PublicKey) => {
  try {
    const tokenAccounts = await getTokenAccountsByOwner(publicKey);
    
    return tokenAccounts.value.map(account => {
      const parsedInfo = account.account.data.parsed.info;
      return {
        mint: parsedInfo.mint,
        amount: parsedInfo.tokenAmount.uiAmount,
        decimals: parsedInfo.tokenAmount.decimals,
        symbol: '', // Would require additional lookup
        name: '', // Would require additional lookup
      };
    });
  } catch (error) {
    console.error("Failed to get user tokens:", error);
    return [];
  }
};
