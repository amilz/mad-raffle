import * as anchor from "@project-serum/anchor";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import { assert, expect } from "chai";
import { raffleNumberBuffer, RAFFLE_SEED, SUPER_RAFFLE_SEED, TRACKER_SEED } from "./helpers/seeds";
import { buildAndSendTx, createAndFundATA, createFundedWallet, createTokenAuthorizationRules } from "./utils/pnft";
import { PNftTransferClient } from './utils/PNftTransferClient';
import { MadRaffle } from "../target/types/mad_raffle";
import { AUTH_KEYPAIR, COLLECTION_KEYPAIR, VAULT_KEYPAIR } from "./helpers/keys";
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

    const [superVaultPda, _superVaultBump] = PublicKey.findProgramAddressSync(
        [SUPER_RAFFLE_SEED],
        program.programId
    );


    it('Sells pNFT to end the Raffle', async () => {
        const nftOwner = await createFundedWallet(provider);

        const name = 'PlayRule123';
        const ruleSetAddr = await new PublicKey('eBJLFYPxJmMGKuFwpDWkzxZeUrad92kZRC5BJLpzyT9');
/*         const ruleSetAddr = await createTokenAuthorizationRules(
            provider,
            nftOwner,
            name
        ); */

        const nftReceiver = await createFundedWallet(provider);

        const creators = Array(5)
            .fill(null)
            .map((_) => ({ address: Keypair.generate().publicKey, share: 20 }));
        const collection = COLLECTION_KEYPAIR;
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
    it("Checks that the raffle is inactive", async () => {
        const raffleStatus = await program.account.raffle.fetch(rafflePda);
        const raffleAccountInfo = await connection.getAccountInfo(rafflePda);
        const raffleMinRent = await connection.getMinimumBalanceForRentExemption(raffleAccountInfo.data.length);
        assert.ok(!raffleStatus.active, "expect that raffle is not active");
        assert.ok(raffleStatus.endTime, "expect that raffle has an end time");
        assert.ok(raffleStatus.prize, "expect that raffle has a prize");
        assert.ok(raffleAccountInfo.lamports >= raffleMinRent, "expect that raffle account has enough lamports");

    });
    it('Try to sell pNFT to Raffle after it is over', async () => {
        try {
            const nftOwner = await createFundedWallet(provider);
  
            const name = 'PlayRule123';
      
            const ruleSetAddr = await new PublicKey('eBJLFYPxJmMGKuFwpDWkzxZeUrad92kZRC5BJLpzyT9');
            /*         const ruleSetAddr = await createTokenAuthorizationRules(
                        provider,
                        nftOwner,
                        name
                    ); */
      
            const nftReceiver = await createFundedWallet(provider);
      
            const creators = Array(5)
              .fill(null)
              .map((_) => ({ address: Keypair.generate().publicKey, share: 20 }));
            const collection = COLLECTION_KEYPAIR;
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
            
            } catch (e) {
                expect(e,"Expect user cannot end raffle bc already over");
            }
    });
    it("Tries to buy ticket after raffle closed", async () => {
        const wallet = await createFundedWallet(provider, 2);
        try {
            let { lastValidBlockHeight, blockhash } = await connection.getLatestBlockhash('finalized');
            const signature = await program.methods
                .buyTicket()
                .accounts({
                    raffle: rafflePda,
                    buyer: wallet.publicKey,
                    feeVault: VAULT_KEYPAIR.publicKey,
                    tracker: trackerPda,
                    superVault: superVaultPda
                })
                .signers([wallet])
                .rpc();
            await connection.confirmTransaction({
                signature,
                lastValidBlockHeight,
                blockhash
            });
            console.log("after raffle closed", signature);
        } catch (e) {
            expect(e, "Expected transaction to fail due to closed raffle");
        }
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
    it('unauthorized cannot send prize', async () => {
        let unauthorized = await createFundedWallet(provider);
        try {
            const raffleStatus = await program.account.raffle.fetch(rafflePda);
            const { winner } = raffleStatus;
            const { mint, ata } = raffleStatus.prize;

            let destAta = await getAssociatedTokenAddress(mint, winner);

            const builder = await pNftTransferClient.buildDistributePNFT({
                authority: unauthorized.publicKey,
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
                extraSigners: [unauthorized],
            });
        } catch (e) {
            expect(e, "Prize distribution should fail");
        }
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

        const winnerBalance = await provider.connection.getTokenAccountBalance(destAta);
        const postRaffleStatus = await program.account.raffle.fetch(rafflePda);
        expect(postRaffleStatus.prize.sent).to.equal(true);
        expect(winnerBalance.value.uiAmount).to.equal(1);
    });

});