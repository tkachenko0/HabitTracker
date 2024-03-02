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
} from './program-interface';

describe("habit-tracker", async () => {

  it("A Simple trace", async () => {
    const promiser: web3.Keypair = await getSystemKeyPair();
    const userDataPDA: web3.PublicKey = getUserDataPDA(promiser.publicKey);
    const [voter1, voter2, voter3] = await Promise.all([
      generateKeyPair(connection, 10),
      generateKeyPair(connection, 10),
      generateKeyPair(connection, 10),
    ]);

    await printParticipants(connection, [
      ['programId', program.programId],
      ['promiser', promiser.publicKey],
      ['userDataPDA', userDataPDA],
      ['voter1', voter1.publicKey],
      ['voter2', voter2.publicKey],
      ['voter3', voter3.publicKey],
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
      voter1.publicKey,
      voter2.publicKey,
      voter3.publicKey,
    );

    await vote(promiseId, voter1, true, promiser.publicKey, [voter2.publicKey, voter3.publicKey]);
    await vote(promiseId, voter2, false, promiser.publicKey, [voter1.publicKey, voter3.publicKey]);
    await vote(promiseId, voter3, true, promiser.publicKey, [voter1.publicKey, voter2.publicKey]);

    await fetchPromise(promiser.publicKey, promiseId);

    //await waitDeadlineSlot(connection, deadlineSlot);
    //await timeout(promiser, promiseId);
  });
});
