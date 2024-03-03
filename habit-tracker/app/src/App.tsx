import { useState } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton, WalletDisconnectButton} from "@solana/wallet-adapter-react-ui";
import { web3, Program, AnchorProvider } from "@coral-xyz/anchor";
import { HabitTracker } from "./types/habit_tracker";
import idl from "./habit_tracker.json";

const programID = new web3.PublicKey(idl.metadata.address);
const network = "http://127.0.0.1:8899";
const opts: web3.ConfirmOptions = { preflightCommitment: "processed" };

const App = () => {
  const wallet = useAnchorWallet();
  const { connected } = useWallet();
  const [error, setError] = useState("");

  const getProvider = () => {
    if (!wallet) return null;
    const connection = new web3.Connection(network, opts);
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
    const connection = new web3.Connection(network, opts.preflightCommitment as web3.Commitment);
    const balance = await connection.getBalance(wallet.publicKey);
    setMyBalance(balance);
  }

  return (
    <div>
      <WalletMultiButton />
      <WalletDisconnectButton />
      <button onClick={registerUser}>Register User</button>
      <button onClick={registerUser}>Register User2</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button onClick={getBalance}>Fetch Balance</button>
      {myBalance && <p>My Balance: {myBalance}</p>}
    </div>
  );
};

export default App;