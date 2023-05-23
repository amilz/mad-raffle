import * as anchor from "@project-serum/anchor";
import { web3, Program, workspace } from '@project-serum/anchor';
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";
import { MadRaffle } from "../target/types/mad_raffle";
import { raffleNumberBuffer, RAFFLE_SEED, TRACKER_SEED } from "./helpers/seeds";
import { AUTH_KEYPAIR, VAULT_KEYPAIR } from "./helpers/keys";

const { PublicKey, Keypair } = web3;

const CURRENT_RAFFLE = 1;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe("Mad Raffle Tests", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.local());

  const program = await workspace.MadRaffle as Program<MadRaffle>;
  const { connection } = program.provider;
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);

  const [trackerPda, _trackerBump] = await PublicKey.findProgramAddressSync(
    [TRACKER_SEED],
    program.programId
  );

  const [rafflePda, _raffleBump] = await PublicKey.findProgramAddressSync(
    [RAFFLE_SEED, raffleNumberBuffer(BigInt(CURRENT_RAFFLE))],
    program.programId
  );

  beforeEach(async () => {
    let { lastValidBlockHeight, blockhash } = await connection.getLatestBlockhash('finalized');
    const airdropTx = await connection.requestAirdrop(AUTH_KEYPAIR.publicKey, LAMPORTS_PER_SOL * 100);
    await connection.confirmTransaction({
      signature: airdropTx,
      lastValidBlockHeight,
      blockhash
    }, 'finalized');  
  });
  beforeEach(async () => {
    try {
      const raffleTracker = await program.account.raffleTracker.fetch(trackerPda);
      if (raffleTracker) return;
    } catch {
      console.log('No tracker found, creating...');
      const tx = await program.methods.initializeTracker()
        .accounts({
          tracker: trackerPda,
          authority: AUTH_KEYPAIR.publicKey,
        })
        .signers([AUTH_KEYPAIR])
        .transaction();
      let { lastValidBlockHeight, blockhash } = await connection.getLatestBlockhash('finalized');
      tx.feePayer = AUTH_KEYPAIR.publicKey;
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      let txId = await anchor.web3.sendAndConfirmTransaction(connection, tx, [AUTH_KEYPAIR], { commitment: "finalized" });
    }
  });
  beforeEach(async () => {
    try {
      const raffleStatus = await program.account.raffle.fetch(rafflePda);
      if (raffleStatus) return;
    } catch {
      console.log('No raffle found, creating...');
      const tx = await program.methods.createRaffle()
        .accounts({
          tracker: trackerPda,
          user: AUTH_KEYPAIR.publicKey,
          raffle: rafflePda
        })
        .signers([AUTH_KEYPAIR])
        .transaction();
      let { lastValidBlockHeight, blockhash } = await connection.getLatestBlockhash('finalized');
      tx.feePayer = AUTH_KEYPAIR.publicKey;
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      let txId = await anchor.web3.sendAndConfirmTransaction(connection, tx, [AUTH_KEYPAIR], { commitment: "finalized" });
    }
  });
  it("Checks that the raffle is active", async () => {
    const raffleStatus = await program.account.raffle.fetch(rafflePda);
    assert.ok(raffleStatus.active, "raffle is active");
  });
  it("Checks that the tracker is updated", async () => {
    const raffleTracker = await program.account.raffleTracker.fetch(trackerPda);
    assert.ok(raffleTracker.currentRaffle.eq(new anchor.BN(CURRENT_RAFFLE)), "currentRaffle should be 1");
  });

  it("Checks the number of ticket buyers", async () => {
    const initialRaffleStatus = await program.account.raffle.fetch(rafflePda);
    if (initialRaffleStatus.tickets.length > 0) return;
    const numberOfBuyers = 10;
    let numberOfTickets = 0;
    const wallets = [];
    for (let i = 0; i < numberOfBuyers; i++) {
      wallets.push(new web3.Keypair());
    }
    const airdropPromises = wallets.map(async (wallet) => {
      // Airdrop 1 SOL to the wallet
      await connection.requestAirdrop(
        wallet.publicKey,
        5 * web3.LAMPORTS_PER_SOL
      );
    });
    await Promise.all(airdropPromises);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const ticketPromises = wallets.map(async (wallet, i) => {
      const timesToBuy = Math.floor(Math.random() * 3) + 1;
      numberOfTickets += timesToBuy;
      for (let j = 0; j < timesToBuy; j++) {
        let { lastValidBlockHeight, blockhash } = await connection.getLatestBlockhash('finalized');

        const signature = await program.methods
          .buyTicket()
          .accounts({
            raffle: rafflePda,
            buyer: wallet.publicKey,
            feeVault: VAULT_KEYPAIR.publicKey,
            tracker: trackerPda
          })
          .signers([wallet])
          .rpc();

        await connection.confirmTransaction({
          signature,
          lastValidBlockHeight,
          blockhash
        });
      }
    });
    await Promise.all(ticketPromises);
    const raffleStatus = await program.account.raffle.fetch(rafflePda);
    assert.strictEqual(
      raffleStatus.tickets.length,
      numberOfBuyers + initialRaffleStatus.tickets.length, // Initial value + new buyersc
      "The number of tickets bought should equal the number of buyers"
    );
    // Compute the sum of all TicketHolder quantities
    const initialTicketsBought = initialRaffleStatus.tickets.reduce((sum, ticketHolder) => sum + ticketHolder.qty, 0);
    const totalTicketsBought = raffleStatus.tickets.reduce((sum, ticketHolder) => sum + ticketHolder.qty, 0);

    // Check if the computed sum is equal to numberOfTickets
    assert.strictEqual(
      totalTicketsBought,
      numberOfTickets + initialTicketsBought,
      "The total number of tickets bought should equal the sum of all TicketHolder quantities"
    );

  });

});
