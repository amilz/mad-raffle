import * as anchor from "@project-serum/anchor";
import { web3, Program, workspace } from '@project-serum/anchor';
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";
import { MadRaffle } from "../target/types/mad_raffle";
import { raffleNumberBuffer, RAFFLE_SEED, THREAD_AUTHORITY_SEED, TRACKER_SEED } from "./helpers/seeds";
import { ClockworkProvider } from "@clockwork-xyz/sdk";
import { AUTH_KEYPAIR, VAULT_KEYPAIR } from "./helpers/keys";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { expect } from "chai";
import { buildAndSendTx, createAndFundATA, createFundedWallet, createTokenAuthorizationRules } from "./utils/pnft";
import { PNftTransferClient } from './utils/PNftTransferClient';
import { COLLECTION_KEYPAIR } from "./helpers/keys";
import { getAssociatedTokenAddress } from "@solana/spl-token";
const { PublicKey, Keypair } = web3;


describe("Raffle Loop", () => {
  // Configure the client to use the local cluster.

  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);

  const pNftTransferClient = new PNftTransferClient(provider.connection, provider.wallet as anchor.Wallet);

  const program = anchor.workspace.MadRaffle as anchor.Program<MadRaffle>;
  const { connection } = program.provider;

  const [trackerPda, _trackerBump] = PublicKey.findProgramAddressSync(
    [TRACKER_SEED],
    program.programId
  );
  for (let CURRENT_RAFFLE = 2; CURRENT_RAFFLE <= 5; CURRENT_RAFFLE++) {

    const [rafflePda, _raffleBump] = PublicKey.findProgramAddressSync(
      [RAFFLE_SEED, raffleNumberBuffer(BigInt(CURRENT_RAFFLE))],
      program.programId
    );
    const [newRafflePda, _newRaffleBump] = PublicKey.findProgramAddressSync(
      [RAFFLE_SEED, raffleNumberBuffer(BigInt(CURRENT_RAFFLE + 1))],
      program.programId
    );


    it(`Checks that the raffle ${CURRENT_RAFFLE} is active`, async () => {
      const raffleStatus = await program.account.raffle.fetch(rafflePda);
      assert.ok(raffleStatus.active, `raffle ${CURRENT_RAFFLE} is active`);
    });
    it(`Checks that the tracker is updated for raffle ${CURRENT_RAFFLE}`, async () => {
      const raffleTracker = await program.account.raffleTracker.fetch(trackerPda);
      assert.ok(raffleTracker.currentRaffle.eq(new anchor.BN(CURRENT_RAFFLE)), `currentRaffle should be ${CURRENT_RAFFLE}`);
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



    it('transfers pnft to another account (1 ruleset)', async () => {
      const nftOwner = await createFundedWallet(provider);

      const name = 'PlayRule123';

      const ruleSetAddr = await createTokenAuthorizationRules(
        provider,
        nftOwner,
        name
      );

      const nftReceiver = await createFundedWallet(provider);

      const creators = Array(5)
        .fill(null)
        .map((_) => ({ address: Keypair.generate().publicKey, share: 20 }));
      const collection = COLLECTION_KEYPAIR; // TODO Set this to defined collection
      const { mint, ata } = await createAndFundATA({
        provider: provider,
        owner: nftOwner,
        creators,
        royaltyBps: 50,
        programmable: true,
        ruleSetAddr,
        collection,
        collectionVerified: true,
        skipNewCollection: true
      });


      let destAta = await getAssociatedTokenAddress(mint, rafflePda, true);

      // we don't need to do this b/c we're not initiating it yet
      /*         const initialReceiverBalance = await provider.connection.getTokenAccountBalance(destAta)
            expect(initialReceiverBalance.value.uiAmount).to.equal(0)
      */
      const builder = await pNftTransferClient.buildTransferPNFT({
        sourceAta: ata,
        nftMint: mint,
        destAta: destAta,
        owner: nftOwner.publicKey,
        tracker: trackerPda,
        raffle: rafflePda,
        newRaffle: newRafflePda,
        creators: creators.map(creator => creator.address),
      })
      await buildAndSendTx({
        provider,
        ixs: [await builder.instruction()],
        extraSigners: [nftOwner],
      });

      const newReceiverBalance = await provider.connection.getTokenAccountBalance(destAta)
      expect(newReceiverBalance.value.uiAmount).to.equal(1)

    });



  }
  it("Logs the scoreboard", async () => {
    const raffleTracker = await program.account.raffleTracker.fetch(trackerPda);
    console.log(raffleTracker.scoreboard.map((score) => `${score.user.toString().slice(0,4)}...: ${score.points.toString()}`));
  });
});