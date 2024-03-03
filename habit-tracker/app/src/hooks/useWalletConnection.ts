import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

export const useWalletConnection = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const { connected } = useWallet();

  return { wallet, connection, connected };
};
