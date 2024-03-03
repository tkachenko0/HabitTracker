import { useState } from "react";
import { useProvider } from "../useProvider";
import { useWalletConnection } from "../useWalletConnection";
import { useProgram } from "./useProgram";

export const useRegisterUser = () => {
  const { provider } = useProvider();
  const { connected } = useWalletConnection();
  const [error, setError] = useState("");
  const program = useProgram();

  const registerUser = async () => {
    setError("");
    if (!connected) {
      setError("Wallet is not connected.");
      return;
    }

    try {
      console.log(`Registering user ${provider?.wallet.publicKey.toBase58()}...`);
      const tx = await program?.methods
        .registerUser()
        .accounts({ user: provider?.wallet.publicKey })
        .rpc();
      console.log("Tx", tx);
    } catch (err) {
      console.error("Error registering user:", err);
      setError("Failed to register.");
    }
  };

  return { registerUser, error };
};
