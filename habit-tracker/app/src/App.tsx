import { WalletMultiButton, WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";
import { useRegisterUser } from "./hooks/program/useRegisterUser";
import { useFetchBalance } from "./hooks/useFetchBalance";
import { useCreatePromise } from "./hooks/program/useCreatePromise";
import UserInvites from "./components/UserInvites";

const App = () => {
  const { registerUser, error: registerError } = useRegisterUser();
  const { getBalance, balance, error: balanceError } = useFetchBalance();
  const { createPromise } = useCreatePromise();

  return (
    <div>
      <WalletMultiButton />
      <WalletDisconnectButton />
      <button onClick={registerUser}>Register User</button>
      {registerError && <p style={{ color: "red" }}>{registerError}</p>}
      <button onClick={getBalance}>Fetch Balance</button>
      {balanceError && <p style={{ color: "red" }}>{balanceError}</p>}
      <p>My Balance: {balance} SOL</p>
      <button onClick={createPromise}>Create Promise</button>
      <UserInvites />
    </div>
  );
};

export default App;
