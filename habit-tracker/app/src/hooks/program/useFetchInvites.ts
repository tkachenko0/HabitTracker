import { useState } from "react";
import { web3 } from "@coral-xyz/anchor";
import { useProgram } from "./useProgram";
import { useWalletConnection } from "../useWalletConnection";

export const useFetchInvites = () => {
  const [invites, setInvites] = useState<web3.PublicKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const program = useProgram();
  const { wallet, connected } = useWalletConnection();

  const fetchInvites = async () => {
    setError("");
    setLoading(true);
    try {

      if (!program) {
        throw new Error("Program is not available.");
      }

      if (!connected) {
        throw new Error("Wallet is not connected.");
      }

      if (!wallet) {
        throw new Error("Wallet is not available.");
      }

      setLoading(true);
      const invitesPDA = getInvitesPDA(wallet.publicKey, program.programId);
      const invitesData = await program.account.userInvites.fetch(invitesPDA);
      setInvites(invitesData.invites);
    } catch (err) {
      console.error("Error during fetching invites", err);
      setError("Failed to fetch invites.");
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchInvites,
    invites,
    loading,
    error
  };
};

export function getInvitesPDA(user: web3.PublicKey, programId: web3.PublicKey): web3.PublicKey {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("UserInvites"), user.toBuffer()],
    programId
  )[0];
}