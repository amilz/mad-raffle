import * as anchor from "@project-serum/anchor";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { raffleNumberBuffer, RAFFLE_SEED, TRACKER_SEED } from "./helpers/seeds";
import { buildAndSendTx, createAndFundATA, createFundedWallet, createTokenAuthorizationRules } from "./utils/pnft";
import { PNftTransferClient } from './utils/PNftTransferClient';
import { MadRaffle } from "../target/types/mad_raffle";
import { AUTH_KEYPAIR, COLLECTION_KEYPAIR } from "./helpers/keys";
import { getAssociatedTokenAddress } from "@solana/spl-token";

describe("pnft_transfer tests (end raffle 1)", () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.local();
    anchor.setProvider(provider);


    const pNftTransferClient = new PNftTransferClient(provider.connection, provider.wallet as anchor.Wallet);
    
    const program = anchor.workspace.MadRaffle as anchor.Program<MadRaffle>;
    const { connection } = program.provider;

    const CURRENT_RAFFLE = 1;
    const [trackerPda, _trackerBump] = PublicKey.findProgramAddressSync(
        [TRACKER_SEED],
        program.programId
    );

    const [rafflePda, _raffleBump] = PublicKey.findProgramAddressSync(
        [RAFFLE_SEED, raffleNumberBuffer(BigInt(CURRENT_RAFFLE))],
        program.programId
    );
    const [newRafflePda, _newRaffleBump] = PublicKey.findProgramAddressSync(
        [RAFFLE_SEED, raffleNumberBuffer(BigInt(CURRENT_RAFFLE + 1))],
        program.programId
    );
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
            collectionVerified: true
        });

        const old_destAta = await getOrCreateAssociatedTokenAccount(
            provider.connection,
            nftReceiver,
            mint,
            nftReceiver.publicKey
        );

        let destAta = await getAssociatedTokenAddress(mint, rafflePda, true);

        const builder = await pNftTransferClient.buildTransferPNFT({
            sourceAta: ata,
            nftMint: mint,
            destAta: destAta,
            owner: nftOwner.publicKey,
            tracker: trackerPda,
            raffle: rafflePda,
            newRaffle: newRafflePda,
            creators: creators.map(creator=>creator.address),
        })
        await buildAndSendTx({
            provider,
            ixs: [await builder.instruction()],
            extraSigners: [nftOwner],
        });

        const newReceiverBalance = await provider.connection.getTokenAccountBalance(destAta)
        expect(newReceiverBalance.value.uiAmount).to.equal(1)
    });
    it('unauthorized cannot select winner', async () => {
        let unauthorized = await createFundedWallet(provider);
        try {
            const tx = await program.methods.selectWinner(new anchor.BN(1))
            .accounts({
              raffle: rafflePda,
              authority: unauthorized.publicKey,
              random: Keypair.generate().publicKey,
            })
            .signers([unauthorized])
            .transaction();
          let { lastValidBlockHeight, blockhash } = await connection.getLatestBlockhash('finalized');
          tx.feePayer = unauthorized.publicKey;
          tx.recentBlockhash = blockhash;
          tx.lastValidBlockHeight = lastValidBlockHeight;
          await anchor.web3.sendAndConfirmTransaction(connection, tx, [unauthorized], { commitment: "finalized" });
        } catch (e) {
            expect(e, "Winner selection should fail");
        }
    });
    it('selects a winner', async () => {
        const tx = await program.methods.selectWinner(new anchor.BN(CURRENT_RAFFLE))
        .accounts({
          raffle: rafflePda,
          authority: AUTH_KEYPAIR.publicKey,
          random: Keypair.generate().publicKey,
        })
        .signers([AUTH_KEYPAIR])
        .transaction();
      let { lastValidBlockHeight, blockhash } = await connection.getLatestBlockhash('finalized');
      tx.feePayer = AUTH_KEYPAIR.publicKey;
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      await anchor.web3.sendAndConfirmTransaction(connection, tx, [AUTH_KEYPAIR], { commitment: "finalized" });
    });
    it('sends prize', async () => {
        const raffleStatus = await program.account.raffle.fetch(rafflePda);
        const { winner } = raffleStatus;
        const { mint, ata } = raffleStatus.prize;
         
        let destAta = await getAssociatedTokenAddress(mint, winner);

        const builder = await pNftTransferClient.buildDistributePNFT({
            authority: AUTH_KEYPAIR.publicKey,
            winner,
            sourceAta: ata,
            nftMint: mint,
            destAta: destAta,
            raffle: rafflePda,
            raffleId: new anchor.BN(CURRENT_RAFFLE),
        })
        await buildAndSendTx({
            provider,
            ixs: [await builder.instruction()],
            extraSigners: [AUTH_KEYPAIR],
        });

        const newReceiverBalance = await provider.connection.getTokenAccountBalance(destAta);
        const postRaffleStatus = await program.account.raffle.fetch(rafflePda);
        expect(postRaffleStatus.prize.sent).to.equal(true);
        expect(newReceiverBalance.value.uiAmount).to.equal(1)});
});