import { useState } from "react";
import { web3 } from "@coral-xyz/anchor";
import { useWalletConnection } from "./useWalletConnection";

export const useFetchBalance = () => {
    const { wallet, connection, connected } = useWalletConnection();
    const [balance, setBalance] = useState(0);
    const [error, setError] = useState("");

    const getBalance = async () => {
        setError("");
        if (!connected) {
            setError("Wallet is not connected.");
            return;
        }
        if (!wallet) {
            setError("Wallet is not available.");
            return;
        }

        try {
            const balance = await connection.getBalance(wallet.publicKey) / web3.LAMPORTS_PER_SOL;
            setBalance(balance);
        } catch (error) {
            setError("Failed to fetch balance.");
        }
    };

    return { getBalance, balance, error };
};
