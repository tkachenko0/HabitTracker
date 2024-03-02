import * as anchor from "@coral-xyz/anchor";
import { web3 } from "@coral-xyz/anchor";
import { sendAnchorInstructions, adjustPromiseMessage } from './utils';
import { connection, program } from './config';

export async function registerUser(user: web3.Keypair) {
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
    voter1: web3.PublicKey,
    voter2: web3.PublicKey,
    voter3: web3.PublicKey,
) {
    console.log(`Starting pool for promise ${promiseId}...`);
    const instruction = await program.methods
        .startPool(
            promiseId,
            new anchor.BN(amountInSOL * web3.LAMPORTS_PER_SOL),
            new anchor.BN(deadline),
            adjustPromiseMessage(promiseMessage),
        ).accounts({
            promiser: promiser.publicKey,
            voter1: voter1,
            voter2: voter2,
            voter3: voter3,
        }).instruction();

    await sendAnchorInstructions(connection, [instruction], [promiser]);
}

export async function vote(
    promiseId: string,
    voter: web3.Keypair,
    choice: boolean,
    promiser: web3.PublicKey,
    otherVoters: web3.PublicKey[] = [],
) {
    console.log(`Voting... user: ${voter.publicKey.toBase58()}, choice: ${choice}`);
    const instruction = await program.methods
        .vote(promiseId, choice)
        .accounts({ voter: voter.publicKey, promiser: promiser })
        .remainingAccounts(otherVoters.map(voterPublicKey => {
            return { pubkey: voterPublicKey, isWritable: true, isSigner: false };
        }))
        .instruction();
    await sendAnchorInstructions(connection, [instruction], [voter]);
}

export async function timeout(promiser: web3.Keypair, promiseId: string) {
    console.log('Timeout...');
    const instruction = await program.methods
        .timeout(promiseId)
        .accounts({ promiser: promiser.publicKey })
        .instruction();
    await sendAnchorInstructions(connection, [instruction], [promiser]);
}

export function getUserDataPDA(user: web3.PublicKey) {
    return web3.PublicKey.findProgramAddressSync(
        [Buffer.from('UserData'), user.toBuffer()],
        program.programId,
    )[0];
}

export function getPromisePDA(promiser: web3.PublicKey, promiseId: string) {
    return web3.PublicKey.findProgramAddressSync(
        [Buffer.from('Promise'), Buffer.from(promiseId), promiser.toBuffer()],
        program.programId,
    )[0];
}

export async function getNumPromises(promiser: web3.PublicKey) {
    const userDataPDA = getUserDataPDA(promiser);
    const promiserData = await program.account.userData.fetch(userDataPDA);
    return promiserData.numPromises.toNumber();
}

export async function fetchPromise(promiser: web3.PublicKey, promiseId: string) {
    const promisePDA = await getPromisePDA(promiser, promiseId);
    const promiseData = await program.account.promise.fetch(promisePDA);

    console.log(`Promise Data PDA: ${promisePDA.toBase58()}`);
    console.log(`PromiseId: ${promiseId}`);

    console.log('Promiser:', promiseData.promiser.toBase58());
    console.log('PromiseMessage:', Buffer.from(promiseData.promiseMessage).slice(0, 200).toString('utf-8'));
    console.log('Amount:', promiseData.amount.toNumber());
    console.log('Deadline:', promiseData.deadline.toNumber());

    console.log('Voter1:', promiseData.voter1.toBase58());
    console.log('Voter1 has voted:', promiseData.voter1HasVoted);
    console.log('Voter1 has voted for:', promiseData.voter1Chiose);

    console.log('Voter2:', promiseData.voter2.toBase58());
    console.log('Voter2 has voted:', promiseData.voter2HasVoted);
    console.log('Voter2 has voted for:', promiseData.voter2Chiose);

    console.log('Voter3:', promiseData.voter3.toBase58());
    console.log('Voter3 has voted:', promiseData.voter3HasVoted);
    console.log('Voter3 has voted for:', promiseData.voter3Chiose);
}