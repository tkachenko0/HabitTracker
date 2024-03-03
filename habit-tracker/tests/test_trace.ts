import { web3 } from "@coral-xyz/anchor";
import { connection, program } from './config';
import {
  generateKeyPair,
  printParticipants,
  getSystemKeyPair,
  waitDeadlineSlot,
} from './utils';
import {
  registerUser,
  startPool,
  vote,
  fetchPromise,
  getNumPromises,
  getUserDataPDA,
  timeout,
  getInvitedPromises,
} from './program-interface';

describe("habit-tracker", async () => {

  it("A Simple trace", async () => {
    const promiser: web3.Keypair = await getSystemKeyPair();
    const userDataPDA: web3.PublicKey = getUserDataPDA(promiser.publicKey);
    const voters = await generateVotersKeyPairs(connection, 4);

    const displayVoters = voters.map(voter => ['voter', voter.publicKey]);
    
    await printParticipants(connection, [
      ['programId', program.programId],
      ['promiser', promiser.publicKey],
      ['userDataPDA', userDataPDA],
      ...displayVoters as [string, web3.PublicKey][]
    ]);

    await registerUser(promiser);

    const numPromises = await getNumPromises(promiser.publicKey);
    const promiseId = `id:${numPromises}`;
    const numSlotsToWait = 25;
    const deadlineSlot = await connection.getSlot() + numSlotsToWait;
    const amountInSOL = 0.1;
    const messageString = `I promise to exercise 3 times a week for 10 weeks. If I fail, I will pay ${amountInSOL} SOL to the voters.`;

    await startPool(
      promiser,
      promiseId,
      amountInSOL,
      deadlineSlot,
      messageString,
      voters.map(voter => voter.publicKey),
    );

    /* const invites = await getInvitedPromises(voters[0].publicKey);
    invites.forEach(invite => {
      console.log(`invite: ${invite.toBase58()}`);
    }); */

    //await voteForAllVoters(promiseId, promiser.publicKey, voters, false);

    //await fetchPromise(promiser.publicKey, promiseId);

    //await waitDeadlineSlot(connection, deadlineSlot);
    //await timeout(promiser, promiseId);
  });

  async function voteForAllVoters(promiseId: string, promiser: web3.PublicKey, voters: web3.Keypair[], choice: boolean): Promise<void> {
    for (const voter of voters) {
      const remainVotersPubkeys = removeVoter(voters, voter.publicKey).map(a => a.publicKey);
      await vote(promiseId, voter, choice, promiser, remainVotersPubkeys);
    }
  }

  async function generateVotersKeyPairs(connection: web3.Connection, numVoters: number): Promise<web3.Keypair[]> {
    const voters: web3.Keypair[] = await Promise.all(
      Array.from({ length: numVoters }, () => generateKeyPair(connection, 10))
    );
    return voters;
  }

  function removeVoter(voters: web3.Keypair[], pubkey: web3.PublicKey): web3.Keypair[] {
    return voters.filter(voter => voter.publicKey !== pubkey);
  }
});
