import * as anchor from "@coral-xyz/anchor";
import { web3 } from "@coral-xyz/anchor";
import { sendAnchorInstructions } from "./utils";
import { connection, program } from "./config";

export async function registerUser(user: web3.Keypair): Promise<void> {
  console.log(`Registering user ${user.publicKey.toBase58()}...`);
  const instruction = await program.methods
    .registerUser()
    .accounts({ user: user.publicKey })
    .instruction();
  await sendAnchorInstructions(connection, [instruction], [user]);
}

export async function startPool(
  promiser: web3.Keypair,
  promiseId: string,
  amountInSOL: number,
  deadline: number,
  promiseMessage: string,
  voters: web3.PublicKey[]
): Promise<void> {
  console.log(`Starting pool for promise ${promiseId}...`);

  let remainingAccounts = voters.map((voterPublicKey) => {
    return { pubkey: voterPublicKey, isWritable: true, isSigner: false };
  });

  const userInvitesAccounts = voters.map((voterPublicKey) => {
    return {
      pubkey: getInvitesPDA(voterPublicKey),
      isWritable: true,
      isSigner: false,
    };
  });

  remainingAccounts.push(...userInvitesAccounts);

  const instruction = await program.methods
    .startPool(
      promiseId,
      new anchor.BN(amountInSOL * web3.LAMPORTS_PER_SOL),
      new anchor.BN(deadline),
      promiseMessage,
      new anchor.BN(voters.length),
      new anchor.BN(promiseMessage.length)
    )
    .accounts({ promiser: promiser.publicKey })
    .remainingAccounts(remainingAccounts)
    .instruction();

  await sendAnchorInstructions(connection, [instruction], [promiser]);
}

export async function vote(
  promiseId: string,
  voter: web3.Keypair,
  choice: boolean,
  promiser: web3.PublicKey,
  otherVoters: web3.PublicKey[]
): Promise<void> {
  console.log(
    `Voting... user: ${voter.publicKey.toBase58()}, choice: ${choice}`
  );
  const instruction = await program.methods
    .vote(promiseId, choice)
    .accounts({ voter: voter.publicKey, promiser: promiser })
    .remainingAccounts(
      otherVoters.map((voterPublicKey) => {
        return { pubkey: voterPublicKey, isWritable: true, isSigner: false };
      })
    )
    .instruction();
  await sendAnchorInstructions(connection, [instruction], [voter]);
}

export async function timeout(
  promiser: web3.Keypair,
  promiseId: string
): Promise<void> {
  console.log("Timeout...");
  const instruction = await program.methods
    .timeout(promiseId)
    .accounts({ promiser: promiser.publicKey })
    .instruction();
  await sendAnchorInstructions(connection, [instruction], [promiser]);
}

export function getUserDataPDA(user: web3.PublicKey): web3.PublicKey {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("UserData"), user.toBuffer()],
    program.programId
  )[0];
}

export function getPromisePDA(
  promiser: web3.PublicKey,
  promiseId: string
): web3.PublicKey {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("Promise"), Buffer.from(promiseId), promiser.toBuffer()],
    program.programId
  )[0];
}

export async function getNumPromises(
  promiser: web3.PublicKey
): Promise<number> {
  const userDataPDA = getUserDataPDA(promiser);
  const promiserData = await program.account.userData.fetch(userDataPDA);
  return promiserData.numPromises.toNumber();
}

export function getInvitesPDA(user: web3.PublicKey): web3.PublicKey {
  return web3.PublicKey.findProgramAddressSync(
    [Buffer.from("UserInvites"), user.toBuffer()],
    program.programId
  )[0];
}

export async function getInvitedPromises(
  user: web3.PublicKey
): Promise<web3.PublicKey[]> {
  const invitesPDA = getInvitesPDA(user);
  const invitesData = await program.account.userInvites.fetch(invitesPDA);
  return invitesData.invites;
}

export async function fetchPromise(
  promiser: web3.PublicKey,
  promiseId: string
) {
  const promisePDA = await getPromisePDA(promiser, promiseId);
  const promiseData = await program.account.promise.fetch(promisePDA);

  console.log(`Promise Data PDA: ${promisePDA.toBase58()}`);
  console.log(`PromiseId: ${promiseId}`);
  console.log("Promiser:", promiseData.promiser.toBase58());
  console.log(
    "PromiseMessage:",
    Buffer.from(promiseData.promiseMessage).toString("utf-8")
  );
  console.log("Amount:", promiseData.amount.toNumber());
  console.log("Deadline:", promiseData.deadline.toNumber());
  promiseData.votes.map((vote) => {
    const choice = vote.vote.yes ? "yes" : vote.vote.no ? "no" : "notVotedYet";
    console.log("Voter:", vote.voter.toBase58());
    console.log("Choice:", choice);
  });
}
