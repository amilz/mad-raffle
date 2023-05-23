import * as anchor from "@project-serum/anchor";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { raffleNumberBuffer, RAFFLE_SEED, TRACKER_SEED } from "./helpers/seeds";
import { buildAndSendTx, createAndFundATA, createFundedWallet, createTokenAuthorizationRules } from "./utils/pnft";
import { PNftTransferClient } from './utils/PNftTransferClient';
import { MadRaffle } from "../target/types/mad_raffle";
import { COLLECTION_KEYPAIR } from "./helpers/keys";
import { getAssociatedTokenAddress } from "@solana/spl-token";

describe("pnft_transfer tests (end raffle 1)", () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.local();
    anchor.setProvider(provider);


    const pNftTransferClient = new PNftTransferClient(provider.connection, provider.wallet as anchor.Wallet);
    
    const program = anchor.workspace.MadRaffle as anchor.Program<MadRaffle>;

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

/*     it('transfers pnft to another account (no ruleset)', async () => {

        const nftOwner = await createFundedWallet(provider);
        const nftReceiver = await createFundedWallet(provider);

        const creators = Array(5)
            .fill(null)
            .map((_) => ({ address: Keypair.generate().publicKey, share: 20 }));

        const { mint, ata } = await createAndFundATA({
            provider: provider,
            owner: nftOwner,
            creators,
            royaltyBps: 1000,
            programmable: true,
        });

        const destAta = await getOrCreateAssociatedTokenAccount(
            provider.connection,
            nftReceiver,
            mint,
            nftReceiver.publicKey
        );
        const initialReceiverBalance = await provider.connection.getTokenAccountBalance(destAta.address)
        expect(initialReceiverBalance.value.uiAmount).to.equal(0)

        const builder = await pNftTransferClient.buildTransferPNFT({
            sourceAta: ata,
            nftMint: mint,
            destAta: destAta.address,
            owner: nftOwner.publicKey,
            receiver: nftReceiver.publicKey,
            raffle: rafflePda,
            tracker: trackerPda
        })
        await buildAndSendTx({
            provider,
            ixs: [await builder.instruction()],
            extraSigners: [nftOwner],
        });

        const newReceiverBalance = await provider.connection.getTokenAccountBalance(destAta.address)
        expect(newReceiverBalance.value.uiAmount).to.equal(1)

    }); */

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
});