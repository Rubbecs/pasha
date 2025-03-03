
import { supabase } from '@/integrations/supabase/client';
import { createWalletFromPrivateKey, getBalance } from '@/lib/solana';
import { WalletDetails } from '@/types';
import CryptoJS from 'crypto-js';

// Save wallet to Supabase
export const saveWallet = async (
  wallet: Omit<WalletDetails, 'id'>,
  encryptionKey: string
): Promise<WalletDetails | null> => {
  try {
    // We'll encrypt the private key before storing it
    const encryptedPrivateKey = CryptoJS.AES.encrypt(
      wallet.keypair.secretKey.toString(), 
      encryptionKey
    ).toString();

    const { data, error } = await supabase.from('wallets').insert({
      name: wallet.name,
      encrypted_private_key: encryptedPrivateKey,
      public_key_string: wallet.publicKey.toString(),
    }).select().single();

    if (error) {
      console.error('Error saving wallet:', error);
      return null;
    }

    return {
      id: data.id,
      keypair: wallet.keypair,
      publicKey: wallet.publicKey,
      name: data.name,
      balance: wallet.balance
    };
  } catch (error) {
    console.error('Error in saveWallet:', error);
    return null;
  }
};

// Get all wallets for the current user
export const getUserWallets = async (
  encryptionKey: string
): Promise<WalletDetails[]> => {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching wallets:', error);
      return [];
    }

    // Reconstruct wallets from database
    const walletPromises = data.map(async (wallet) => {
      try {
        // Decrypt the private key
        const bytes = CryptoJS.AES.decrypt(wallet.encrypted_private_key, encryptionKey);
        const privateKeyStr = bytes.toString(CryptoJS.enc.Utf8);
        
        // Create the keypair
        const keypair = createWalletFromPrivateKey(privateKeyStr);
        const balance = await getBalance(keypair.publicKey);

        return {
          id: wallet.id,
          keypair,
          publicKey: keypair.publicKey,
          name: wallet.name,
          balance
        };
      } catch (decryptError) {
        console.error('Error decrypting wallet:', decryptError);
        return null;
      }
    });

    // Filter out any wallets that failed to decrypt
    const wallets = (await Promise.all(walletPromises)).filter(
      (wallet): wallet is WalletDetails => wallet !== null
    );

    return wallets;
  } catch (error) {
    console.error('Error in getUserWallets:', error);
    return [];
  }
};

// Delete a wallet
export const deleteWallet = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('wallets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting wallet:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteWallet:', error);
    return false;
  }
};

// Update wallet balance
export const updateWalletBalance = async (
  wallet: WalletDetails
): Promise<number> => {
  try {
    const balance = await getBalance(wallet.publicKey);
    return balance;
  } catch (error) {
    console.error('Error updating wallet balance:', error);
    return wallet.balance;
  }
};
