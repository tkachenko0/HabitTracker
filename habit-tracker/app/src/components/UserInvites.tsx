import { useEffect, useMemo } from "react";
import { useFetchInvites } from "../hooks/useFetchInvites";
import { useProgram } from "../hooks/useProgram";
import { useWalletConnection } from "../hooks/useWalletConnection";

const UserInvites = () => {
  const { fetchInvites, invites, loading, error } = useFetchInvites();
  const program = useProgram();
  const { wallet } = useWalletConnection();

  useEffect(() => {
    fetchInvites();
  }, [wallet]);

  const numInvites = useMemo(() => invites.length, [invites]);

  return (
    <div>
      <h3>Invites</h3>
      <p>Number of invites: {numInvites}</p>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul>
        {invites.map((invite, index) => (
          <li key={index}>{invite.toBase58()}</li>
        ))}
      </ul>
    </div>
  );
};

export default UserInvites;
