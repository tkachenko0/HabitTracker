import { web3, AnchorProvider } from "@coral-xyz/anchor";
import { useWalletConnection } from "./useWalletConnection";
const opts: web3.ConfirmOptions = { preflightCommitment: "processed" };

export const useProvider = () => {
    const { wallet, connection } = useWalletConnection();

    const provider = wallet ? new AnchorProvider(connection, wallet, opts) : null;

    return { provider };
};
