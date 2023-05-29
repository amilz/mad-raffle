import * as anchor from "@project-serum/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, SYSVAR_INSTRUCTIONS_PUBKEY, SYSVAR_RENT_PUBKEY, TransactionInstruction } from "@solana/web3.js";
import { AUTH_PROGRAM_ID, TOKEN_METADATA_PROGRAM, VAULT_KEYPAIR } from "./constants/keys";
import { raffleNumberBuffer, RAFFLE_SEED, SUPER_RAFFLE_SEED, TRACKER_SEED } from "./constants/seeds";
import { ApiError, SolanaQueryType } from "./error";
import { MadRaffle, Raffle, ScoreboardEntry } from "./types/types";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Metaplex } from "@metaplex-foundation/js";
import { AuthorizationData, Metadata } from "@metaplex-foundation/mpl-token-metadata";

export class MadRaffleSDK {
    private readonly program: anchor.Program<MadRaffle> | undefined;
    private currentRaffle: CurrentRaffle | undefined;

    private constructor(program: anchor.Program<MadRaffle> | undefined) {
        this.program = program;
    }

    public static dummy(): MadRaffleSDK {
        return new MadRaffleSDK(undefined);
    }

    public static from(program: anchor.Program<MadRaffle>): MadRaffleSDK {
        return new MadRaffleSDK(program);
    }

    public setCurrentRaffle(raffle: CurrentRaffle): void {
        this.currentRaffle = raffle;
    }



    /**
     * @returns true if the SDK is ready to be used to make requests
     */
    public isReady(): boolean {
        return this.program != null;
    }

    /**
     * 
     * @returns the tracker PDA
     */
    public getTrackerPda(): PublicKey {
        const [trackerPda, _trackerBump] = PublicKey.findProgramAddressSync(
            [TRACKER_SEED],
            this.program.programId
        );
        return trackerPda;
    }

    /**
     * 
     * @param params Raffle ID (as a positive integer), optional, and boolean to fetch the current raffle, optional (if true, will override raffleId)
     * @returns the PDA for the specified raffle
     */
    public async getRafflePda(params: GetRaffleDetailsParams): Promise<CurrentRaffle> {
        const { raffleId, current } = params;
        if (current) {
            const currentRaffleId = await this.getCurrentRaffleId();
            if (!currentRaffleId) { ApiError.solanaQueryError(SolanaQueryType.UNABLE_TO_FIND_CURRENT_RAFFLE) }
            params.raffleId = currentRaffleId;
        }

        this.validateRaffleId(raffleId);

        const raffleBigInt = BigInt(raffleId);
        const [rafflePda, _raffleBump] = PublicKey.findProgramAddressSync(
            [RAFFLE_SEED, raffleNumberBuffer(BigInt(raffleBigInt))],
            this.program.programId
        );
        this.setCurrentRaffle({id: raffleId, pda: rafflePda});
        return {id: raffleId, pda: rafflePda};
    }

    /**
     * 
     * @returns the super vault PDA
     */
    public getSuperVaultPda(): PublicKey {
        const [superVaultPda, _superVaultBump] = PublicKey.findProgramAddressSync(
            [SUPER_RAFFLE_SEED],
            this.program.programId
        );
        return superVaultPda;
    }

    /**
     * 
     * @returns the current raffle id from the tracker PDA
     */
    public async getCurrentRaffleId(): Promise<number> {
        const trackerPda = this.getTrackerPda();
        const raffleTracker = await this.program.account.raffleTracker.fetch(trackerPda);
        return raffleTracker.currentRaffle.toNumber();
    }

    /**
     * 
     * @returns the bonus points scoreboard from the tracker PDA
     */
    public async getScoreBoard() {
        const trackerPda = this.getTrackerPda();
        const raffleTracker = await this.program.account.raffleTracker.fetch(trackerPda);
        const scoreboard: ScoreboardEntry[] = raffleTracker.scoreboard.map((entry) => ({
            user: new PublicKey(entry.user),
            points: entry.points,
        }));
        return scoreboard;
    }

    /**
     * 
     * @param raffleId the raffle id (as a positive integer), optional
     * @param current boolean to fetch the current raffle, optional (if true, will override raffleId)
     * @returns details about the specified raffle
     */
    public async getRaffleDetails(params: GetRaffleDetailsParams): Promise<Raffle> {
        const { raffleId, current } = params;
        const {connection} = this.program.provider;
        let rafflePda: PublicKey;
        if (current) { rafflePda = (await this.getRafflePda({ current: true })).pda }
        else { rafflePda = (await this.getRafflePda({ raffleId })).pda }

        const fetchedRaffleData = await this.program.account.raffle.fetch(rafflePda);
        
        const raffleAcctInfo = await connection.getAccountInfo(rafflePda);
        const balance = raffleAcctInfo?.lamports ?? 0;
        //TODO (amilz) add as constant or calc'd
        //TODO (amilz) make sure all are in lamports vs SOL
        const newRaffleRent = await connection.getMinimumBalanceForRentExemption(138);
        const raffleMinRent = await connection.getMinimumBalanceForRentExemption(raffleAcctInfo.data.length);
        const availableBalance = balance - newRaffleRent - raffleMinRent;
        const sellerFeeBasisPoints = 420; // 4.2% TODO (amilz) make this dynamic
        const totalRate = 10000; // 100%
        const sellerFeeLamports = (availableBalance * totalRate) / (totalRate + sellerFeeBasisPoints);

        const raffle: Raffle = {
            id: fetchedRaffleData.id.toNumber(),
            version: fetchedRaffleData.version,
            bump: fetchedRaffleData.bump,
            active: fetchedRaffleData.active,
            tickets: fetchedRaffleData.tickets.map((ticket) => ({
                user: ticket.user,
                qty: ticket.qty,
            })),
            startTime: fetchedRaffleData.startTime.toNumber(),
            endTime: fetchedRaffleData.endTime.toNumber(),
            prize: fetchedRaffleData.prize,
            winner: fetchedRaffleData.winner,
            availableLamports: sellerFeeLamports,
        };
        return raffle;
    }

    /**
     * 
     * @returns buy ticket instruction for the connected wallet to buy a ticket from the current raffle
     */
    public async createBuyTicketInstruction(): Promise<anchor.web3.TransactionInstruction> {
        return await this.program.methods
            .buyTicket()
            .accounts({
                raffle: this.currentRaffle.pda,
                buyer: this.program.provider.publicKey,
                feeVault: VAULT_KEYPAIR.publicKey,
                tracker: this.getTrackerPda(),
                superVault: this.getSuperVaultPda()
            })
            .instruction();
    }


    private validateRaffleId(raffleId: number | undefined): void {
        if (raffleId === undefined) ApiError.solanaQueryError(SolanaQueryType.INVALID_ARGUMENT);
        if (raffleId < 1) ApiError.solanaQueryError(SolanaQueryType.INVALID_ARGUMENT);
        if (raffleId % 1 !== 0) ApiError.solanaQueryError(SolanaQueryType.INVALID_ARGUMENT);
    }

    /**
     * 
     * @param mint the mint of an NFT for the current raffle 
     * @returns the raffle's ATA for the specified mint
     */
    private getRaffleAta(mint: PublicKey): PublicKey {
        return getAssociatedTokenAddressSync(mint, this.currentRaffle.pda, true);
    }

    /**
     * 
     * @param mint the mint of an NFT for the current raffle
     * @returns the user's ATA for the specified mint
     */
    private getUserAta(mint: PublicKey): PublicKey {
        return getAssociatedTokenAddressSync(mint, this.program.provider.publicKey);
    }

    /**
     * 
     * @param mint token mint of the NFT
     * @param ata associated token account of the NFT and the user or pda 
     * @returns token record pda (for pnft transfers)
     */
    private findTokenRecordPDA = (mint: PublicKey, ata: PublicKey) => {
        const [recordPda, recordBump] = PublicKey.findProgramAddressSync(
            [
                Buffer.from('metadata'),
                TOKEN_METADATA_PROGRAM.toBuffer(),
                mint.toBuffer(),
                Buffer.from('token_record'),
                ata.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM
        );
        return recordPda
    };

    /**
     * 
     * @param mint the mint of an NFT for the current raffle
     * @returns PrepPnftAccountsResult for handling pnft transfers
     */
    private async prepPnftAccounts(mint: PublicKey): Promise<PrepPnftAccountsResult> {
        const METAPLEX = new Metaplex(this.program.provider.connection);
        const sourceAta = this.getUserAta(mint);
        const sourceTokenRecordPda = this.findTokenRecordPDA(mint, sourceAta);
        const targetAta = this.getRaffleAta(mint);
        const targetTokenRecordPda = this.findTokenRecordPDA(mint, targetAta);
        const targetNft = await METAPLEX
            .nfts()
            .findByMint({ mintAddress: mint, loadJsonMetadata: true });
        const metadataPda = targetNft.metadataAddress;
        const creators = targetNft.creators.map((creator) => creator.address);
        const creatorAccounts: CreatorAccounts = creators.reduce((acc, creator, i) => {
            acc[`creator${i + 1}`] = creator;
            return acc;
        }, {});
        const inflatedMeta = await Metadata.fromAccountAddress(
            this.program.provider.connection,
            metadataPda
        );
        const ruleSet = inflatedMeta.programmableConfig?.ruleSet;
        const nftEditionPda = METAPLEX.nfts().pdas().edition({ mint: mint });
        const authDataSerialized = null;
        const remainingAccounts: RemainingAccount[] = [];
        if (!!ruleSet) {
            remainingAccounts.push({
                pubkey: ruleSet,
                isSigner: false,
                isWritable: false,
            });
        }

        return {
            metadataPda,
            creatorAccounts,
            sourceAta,
            sourceTokenRecordPda,
            targetAta,
            targetTokenRecordPda,
            ruleSet,
            nftEditionPda,
            authDataSerialized,
            remainingAccounts
        }
    }

    /**
     * 
     * @param nftToSell the mint of an NFT the seller wants to sell
     * @returns a sell instruction for the connected wallet to sell the specified NFT to the current raffle
     */
    public async createEndRaffleInstruction(nftToSell: PublicKey): Promise<anchor.web3.TransactionInstruction> {
        const {
            metadataPda,
            creatorAccounts,
            sourceAta,
            sourceTokenRecordPda,
            targetAta,
            targetTokenRecordPda,
            ruleSet,
            nftEditionPda,
            authDataSerialized,
            remainingAccounts
        } = await this.prepPnftAccounts(nftToSell);
        // Fetch the PDA for the next raffle to be created
        const {pda: newRaffle} = await this.getRafflePda({ raffleId: this.currentRaffle.id + 1});
        return await this.program.methods
            .endRaffle(authDataSerialized, !!ruleSet)
            .accounts({
                owner: this.program.provider.publicKey,
                src: sourceAta,
                dest: targetAta,
                ownerTokenRecord: sourceTokenRecordPda,
                destTokenRecord: targetTokenRecordPda,
                nftMint: nftToSell,
                edition: nftEditionPda,
                nftMetadata: metadataPda,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                rent: SYSVAR_RENT_PUBKEY,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                pnftShared: {
                    authorizationRulesProgram: AUTH_PROGRAM_ID,
                    tokenMetadataProgram: TOKEN_METADATA_PROGRAM,
                    instructions: SYSVAR_INSTRUCTIONS_PUBKEY
                },
                raffle: this.currentRaffle.pda,
                newRaffle,
                tracker: this.getTrackerPda(),
                ...creatorAccounts
            })
            .remainingAccounts(remainingAccounts)
            .instruction();
    }

}

interface GetRaffleDetailsParams {
    raffleId?: number;
    current?: boolean;
}

interface PrepPnftAccountsResult {
    metadataPda: PublicKey;
    creatorAccounts: CreatorAccounts;
    sourceAta: PublicKey;
    sourceTokenRecordPda: PublicKey;
    targetAta: PublicKey;
    targetTokenRecordPda: PublicKey;
    ruleSet: PublicKey | undefined;
    nftEditionPda: PublicKey;
    authDataSerialized: any;
    remainingAccounts: RemainingAccount[];
}

interface RemainingAccount {
    pubkey: PublicKey;
    isSigner: boolean;
    isWritable: boolean;
}

interface CreatorAccounts {
    [key: string]: PublicKey;
}

interface CurrentRaffle {
    id: number,
    pda: PublicKey
}