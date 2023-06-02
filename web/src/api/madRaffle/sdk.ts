import * as anchor from "@project-serum/anchor";
import { Keypair, PublicKey, SystemProgram, SYSVAR_INSTRUCTIONS_PUBKEY, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { AUTH_PROGRAM_ID, COLLECTION_PUBKEY, TOKEN_METADATA_PROGRAM, VAULT_PUBKEY, AUTH_PUBKEY } from "./constants/keys";
import { raffleNumberBuffer, RAFFLE_SEED, SUPER_RAFFLE_SEED, TRACKER_SEED } from "./constants/seeds";
import { ApiError, SolanaQueryType } from "./error";
import { MadRaffle, Raffle, ScoreboardEntry } from "./types/types";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { FindNftsByUpdateAuthorityOutput, JsonMetadata, Metaplex } from "@metaplex-foundation/js";
import { Creator, Metadata } from "@metaplex-foundation/mpl-token-metadata";

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
        const { current } = params;
        let raffleId: number = params.raffleId;
        if (current) {
            const currentRaffleId = await this.getCurrentRaffleId();
            if (!currentRaffleId) { ApiError.solanaQueryError(SolanaQueryType.UNABLE_TO_FIND_CURRENT_RAFFLE) }
            raffleId = currentRaffleId;
        }
        this.validateRaffleId(raffleId);

        const raffleBigInt = BigInt(raffleId);
        const [rafflePda, _raffleBump] = PublicKey.findProgramAddressSync(
            [RAFFLE_SEED, raffleNumberBuffer(BigInt(raffleBigInt))],
            this.program.programId
        );
        return { id: raffleId, pda: rafflePda };
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
        if (!this.program || !this.program.provider) return; //TODO (amilz) throw error
        const { raffleId, current } = params;
        const { connection } = this.program.provider;
        let rafflePda: PublicKey;
        if (current) { rafflePda = (await this.getRafflePda({ current: true })).pda }
        else { rafflePda = (await this.getRafflePda({ raffleId })).pda }

        const fetchedRaffleData = await this.program.account.raffle.fetch(rafflePda);

        const raffleAcctInfo = await connection.getAccountInfo(rafflePda);
        const balance = raffleAcctInfo?.lamports ?? 0;
        const newRaffleRent = await connection.getMinimumBalanceForRentExemption(138);
        const raffleMinRent = await connection.getMinimumBalanceForRentExemption(raffleAcctInfo.data.length);
        const availableBalance = balance - newRaffleRent - raffleMinRent;
        const sellerFeeBasisPoints = 420; // 4.2% TODO (amilz) make this dynamic
        const totalRate = 10000; // 100%
        const sellerFeeLamports = (availableBalance * totalRate) / (totalRate + sellerFeeBasisPoints);
        const availableLamports = sellerFeeLamports >= 0 ? sellerFeeLamports : 0;
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
            availableLamports,
            pda: rafflePda,
        };
        return raffle;
    }

    public getUserTickets(user: PublicKey, raffle: Raffle): number {
        return raffle.tickets.find((ticket) => ticket.user.toBase58() === user.toBase58())?.qty ?? 0;
    }
    public getTotalTickets(raffle: Raffle): number {
        return raffle.tickets.reduce((acc, ticket) => acc + ticket.qty, 0);
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
                feeVault: VAULT_PUBKEY,
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
        const { pda: newRaffle } = await this.getRafflePda({ raffleId: this.currentRaffle.id + 1 });
        let accounts = {
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
            creator1: creatorAccounts.creator1,
            //TODO(amilz) I shouldn't have to do this
            creator2: Keypair.generate().publicKey,
            creator3: Keypair.generate().publicKey,
            creator4: Keypair.generate().publicKey,
            creator5: Keypair.generate().publicKey,
        };
        return await this.program.methods
            .endRaffle(authDataSerialized, !!ruleSet)
            .accounts(accounts)
            .remainingAccounts(remainingAccounts)
            .instruction();
    }

    public async fetchUserNfts(): Promise<SimpleNFT[]> {
        if (!this.program.provider.publicKey) {
            ApiError.solanaQueryError(SolanaQueryType.NO_WALLET_CONNECTED);
        }
        const METAPLEX = new Metaplex(this.program.provider.connection);
        const allNFTs: FindNftsByUpdateAuthorityOutput = await METAPLEX.nfts().findAllByOwner({ owner: this.program.provider.publicKey });
        const collectionNFTs = allNFTs.filter(nft => nft.collection && nft.collection.address.toBase58() == COLLECTION_PUBKEY.toBase58());
        const loadedNFTs = await Promise.all(collectionNFTs.map(async nft => {
            if ('jsonLoaded' in nft && !nft.jsonLoaded) {
                //@ts-ignore
                return await METAPLEX.nfts().load({ metadata: nft as Metadata<JsonMetadata<string>> });
            } else {
                return nft;
            }
        }));

        const simpleNfts: SimpleNFT[] = loadedNFTs.map((nft) => {
            const { sellerFeeBasisPoints, creators, collection, json } = nft;
            return {
                mint: nft.address,
                name: json ? json.name : '',
                sellerFeeBasisPoints: sellerFeeBasisPoints,
                creators: creators,
                collection: collection ? collection.address : null,
                verified: collection ? collection.verified : null,
                image: json ? json.image : '',
                uri: json ? json.uri : '',
            } as SimpleNFT;
        });
        return simpleNfts;
    }

    public async createSelectWinnerInstruction(raffleId: number): Promise<anchor.web3.TransactionInstruction> {
        const currentRaffle = new anchor.BN(raffleId);
        const { pda: raffle } = await this.getRafflePda({ raffleId });
        const random = Keypair.generate().publicKey;
        const authority = AUTH_PUBKEY;
        const accounts = { raffle, authority, random };

        return await this.program.methods
            .selectWinner(currentRaffle)
            .accounts(accounts)
            .instruction();
    }

    private async prepDistirbutePrizeAccounts(mint: PublicKey, sourceAta: PublicKey, targetAta: PublicKey): Promise<PrepPnftAccountsResult> {
        const METAPLEX = new Metaplex(this.program.provider.connection);
        const sourceTokenRecordPda = this.findTokenRecordPDA(mint, sourceAta);
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

    public async createDistributePrizeInstruction(raffleId: number): Promise<anchor.web3.TransactionInstruction> {
        const raffleIdBN = new anchor.BN(raffleId);
        const raffleStatus = await this.getRaffleDetails({ raffleId });
        console.log(raffleStatus);
        const { winner, pda: rafflePda } = await raffleStatus;
        const { mint, ata: src } = await raffleStatus.prize;

        // TODO for some reaseon winner, ata, and mint are not showing up in accounts
        let dest = getAssociatedTokenAddressSync(mint, winner);
        const {
            metadataPda,
            sourceTokenRecordPda,
            targetTokenRecordPda,
            ruleSet,
            nftEditionPda,
            authDataSerialized,
            remainingAccounts
        } = await this.prepDistirbutePrizeAccounts(mint, src, dest);
        let accounts = {
            //TODO (amilz) this should be auth or winner
            authority: this.program.provider.publicKey,
            winner: new PublicKey(winner.toBase58()),
            src: new PublicKey(src.toBase58()),
            dest: new PublicKey(dest.toBase58()),
            ownerTokenRecord: sourceTokenRecordPda,
            destTokenRecord: targetTokenRecordPda,
            nftMint: new PublicKey(mint.toBase58()),
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
            raffle: rafflePda,
            //ruleSet: new PublicKey('eBJLFYPxJmMGKuFwpDWkzxZeUrad92kZRC5BJLpzyT9')
        };
        console.table(logPublicKeyObj(accounts));
        return await this.program.methods
            .distributePrize(raffleIdBN, authDataSerialized, !!ruleSet)
            .accountsStrict(accounts)
            .remainingAccounts(remainingAccounts)
            .instruction();
    }
    public async updateRaffleHistory(): Promise<LocalRaffle[]> {
        const currentRaffle = await this.getCurrentRaffleId();
        // Check if localStorage is available
        let allRaffles: LocalRaffle[] = [];
        if (typeof Storage !== "undefined") {
            // Fetch existing raffles from localStorage
            let localRaffles: LocalRaffle[] = [];
            const storedRaffles = localStorage.getItem('localRaffles');
            if (storedRaffles) {
                const parsedRaffles = JSON.parse(storedRaffles);
                if (Array.isArray(parsedRaffles) && parsedRaffles.every(raffle => this.isLocalRaffle(raffle))) {
                    localRaffles = parsedRaffles;
                }
            }
    
            // If the currentRaffleId > 1, we start the loop
            if (currentRaffle > 1) {
                for (let n = 1; n < currentRaffle; n++) {
                    // If the raffle already exists in local storage, skip
                    const thisRaffle = localRaffles.find(raffle => raffle.id === n);
                    if (thisRaffle) {
                        allRaffles.push(thisRaffle)
                        continue;
                    }
    
                    try {
                        // Fetch the raffle from the backend
                        let fetchedRaffle: Raffle = await this.getRaffleDetails({ raffleId: n });
                        let localRaffle = this.convertToLocalRaffle(fetchedRaffle);
                        allRaffles.push(localRaffle);
                        // If the raffle is claimed, add to local storage
                        if (fetchedRaffle.prize && fetchedRaffle.prize.sent) {                            
                            localRaffles.push(localRaffle);                            
                            localStorage.setItem('localRaffles', JSON.stringify(localRaffles));
                        }
                    } catch (error) {
                        console.error(`Failed to fetch details for raffle ${n}:`, error);
                    }
                }
            }
        } else {
            console.warn("localStorage is not available");
        }
        return allRaffles;
    }

    private isLocalRaffle(object: any): object is LocalRaffle {
        return object &&
            typeof object.id === 'number' &&
            typeof object.version === 'number' &&
            typeof object.bump === 'number' &&
            typeof object.active === 'boolean' &&
            typeof object.numTickets === 'number' &&
            typeof object.startTime === 'number' &&
            typeof object.endTime === 'number' &&
            (!object.prizeNft || object.prizeNft instanceof PublicKey) && 
            (!object.winner || object.winner instanceof PublicKey) && 
            typeof object.claimed === 'boolean';
    }
    
    
    private convertToLocalRaffle(fetchedRaffle: Raffle):LocalRaffle {
        // Convert the fetched raffle into a LocalRaffle here...
        // The below is just a hypothetical example
        const numTickets = this.getTotalTickets(fetchedRaffle);
        return {
            id: fetchedRaffle.id,
            version: fetchedRaffle.version,
            bump: fetchedRaffle.bump,
            active: fetchedRaffle.active,
            numTickets,
            startTime: fetchedRaffle.startTime,
            endTime: fetchedRaffle.endTime,
            prizeNft: fetchedRaffle.prize.mint ?? null,
            winner: fetchedRaffle.winner ?? null,
            claimed: fetchedRaffle.prize.sent ?? false,
        };
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

export interface SimpleNFT {
    mint?: PublicKey; // assuming string is okay here. If not, adjust accordingly
    name?: string; // '?' means it can be undefined
    sellerFeeBasisPoints?: number;
    creators?: Creator[]; // assuming Creator is a known type
    collection?: PublicKey;
    verified?: boolean;
    image?: string;
    uri?: string;
}


function logPublicKeyObj(obj: { [key: string]: any }, path: string[] = []) {
    let entries: { Key: string, PublicKey: string }[] = [];

    for (const [key, value] of Object.entries(obj)) {
        const newPath = [...path, key];

        if (value instanceof PublicKey) {

            entries.push({
                Key: newPath.join('.'),
                PublicKey: value.toString()
            });
        } else if (typeof value === 'object' && value !== null) {
            entries = entries.concat(logPublicKeyObj(value, newPath));
        }
    }

    return entries;
}

export interface LocalRaffle {
    id: number;
    version: number;
    bump: number;
    active: boolean;
    numTickets: number;
    startTime: number;
    endTime: number;
    prizeNft: PublicKey;
    winner: PublicKey;
    claimed: boolean;
}

