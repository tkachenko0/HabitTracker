import { useState } from "react";
import { useProvider } from "../useProvider";
import { useWalletConnection } from "../useWalletConnection";
import { useProgram } from "./useProgram";
import * as anchor from "@coral-xyz/anchor";
import { web3 } from "@coral-xyz/anchor";
import { getInvitesPDA } from "./useFetchInvites";

export const useCreatePromise = () => {
    const { provider } = useProvider();
    const { connected, connection } = useWalletConnection();
    const [error, setError] = useState("");
    const program = useProgram();

    const createPromise = async () => {
        setError("");
        if (!connected) {
            setError("Wallet is not connected.");
            return;
        }

        if (!provider) {
            setError("Program is not available.");
            return;
        }

        if (!program) {
            setError("Program is not available.");
            return 0;
        }

        const userDataPDA = web3.PublicKey.findProgramAddressSync(
            [Buffer.from("UserData"), provider?.wallet.publicKey.toBuffer()],
            program.programId
        )[0];

        const promiserData = await program.account.userData.fetch(userDataPDA);

        const numPromises = promiserData.numPromises.toNumber();

        const promiseId = `id:${numPromises}`;
        const amountInSOL = 0.1;
        const numSlotsToWait = 25;
        const deadlineSlot = (await connection.getSlot()) + numSlotsToWait;
        const promiseMessage = `I promise to exercise 3 times a week for 10 weeks. If I fail, I will pay ${amountInSOL} SOL to the voters.`;
        const voters = await generateVotersKeyPairs(connection, 4);


        let remainingAccounts = voters.map((voter) => {
            return { pubkey: voter.publicKey, isWritable: true, isSigner: false };
          });
        
          const userInvitesAccounts = voters.map((voter) => {
            return {
              pubkey: getInvitesPDA(voter.publicKey, program.programId),
              isWritable: true,
              isSigner: false,
            };
          });
        
          remainingAccounts.push(...userInvitesAccounts);

        try {
            console.log(`Creating Promise...`);
            const tx = await program?.methods
                .startPool(
                    promiseId,
                    new anchor.BN(amountInSOL * web3.LAMPORTS_PER_SOL),
                    new anchor.BN(deadlineSlot),
                    promiseMessage,
                    new anchor.BN(voters.length),
                    new anchor.BN(promiseMessage.length)
                )
                .accounts({ promiser: provider?.wallet.publicKey })
                .remainingAccounts(remainingAccounts)
                .rpc();
            console.log("Tx", tx);
        } catch (err) {
            console.error("Error during promise creation:", err);
            setError("Failed to create promise.");
        }
    };

    return { createPromise, error };
};

async function generateVotersKeyPairs(
    connection: web3.Connection,
    numVoters: number
): Promise<web3.Keypair[]> {
    const voters: web3.Keypair[] = await Promise.all(
        Array.from({ length: numVoters }, () => generateKeyPair(connection, 10))
    );
    return voters;
}

export async function generateKeyPair(
    connection: web3.Connection,
    balanceInSOL: number
): Promise<web3.Keypair> {
    const kp = web3.Keypair.generate();
    const accountInfo = await connection.getAccountInfo(kp.publicKey);

    if (accountInfo === null) {
        const signature = await connection.requestAirdrop(
            kp.publicKey,
            web3.LAMPORTS_PER_SOL * balanceInSOL
        );
        await connection.confirmTransaction(signature);
    }

    return kp;
}