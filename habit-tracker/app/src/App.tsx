import { useState } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton, WalletDisconnectButton} from "@solana/wallet-adapter-react-ui";
import { web3, Program, AnchorProvider } from "@coral-xyz/anchor";
import { HabitTracker } from "./interface/habit_tracker";
import idl from "./interface/habit_tracker.json"

const programID = new web3.PublicKey(idl.metadata.address);
const opts: web3.ConfirmOptions = { preflightCommitment: "processed" };

const App = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const { connected, sendTransaction } = useWallet();
  const [error, setError] = useState("");

  const getProvider = () => {
    if (!wallet) return null;
    return new AnchorProvider(connection, wallet, opts);
  };

  const registerUser = async () => {
    setError("");
    if (!connected) {
      setError("Wallet is not connected.");
      return;
    }
    const provider = getProvider();
    if (!provider) {
      setError("Provider is not available.");
      return;
    }

    const program = new Program<HabitTracker>(idl as unknown as HabitTracker, programID, provider);

    try {
      console.log(`Registering user ${provider.wallet.publicKey.toBase58()}...`);
      const tx = await program.methods
        .registerUser()
        .accounts({ user: provider.wallet.publicKey })
        .rpc();
      console.log("Tx", tx);
    } catch (err) {
      console.error("Error creating greeting account:", err);
      setError("Failed to create greeting account. Please try again.");
    }
  };

  const [myBalance, setMyBalance] = useState(0);

  const getBalance = async () => {
    if (!connected) {
      setError("Wallet is not connected.");
      return;
    }
    if (!wallet) {
      setError("Wallet is not available.");
      return;
    }
    const provider = getProvider();
    if (!provider) {
      setError("Provider is not available.");
      return;
    }
    const balance = await connection.getBalance(wallet.publicKey) / web3.LAMPORTS_PER_SOL;
    setMyBalance(balance);
  }

  return (
    <div>
      <WalletMultiButton />
      <WalletDisconnectButton />
      <button onClick={registerUser}>Register User</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button onClick={getBalance}>Fetch Balance</button>
      {myBalance && <p>My Balance: {myBalance} SOL</p>}
      {/* print connection cluster */}
      <p>Connected to cluster: {connection.rpcEndpoint}</p>
    </div>
  );
};

export default App;