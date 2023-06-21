import * as anchor from "@coral-xyz/anchor";
import { IDL, MadRaffle, Raffle } from "./types/types";
import { MAD_RAFFLE_PROGRAM_ID } from "./constants/id";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { MadRaffleSDK, SimpleNFT } from "./sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import { useSolanaConnection } from "react-xnft";

declare global {
    interface Window {
      xnft: any;
    }
  }

export interface MadRaffleProgramContextState {
    madRaffle: MadRaffleSDK;
    madRaffleIsReady: boolean;
    player: PublicKey | undefined;
    playerNfts: SimpleNFT[];
    connection: Connection;
    currentRaffle: Raffle | undefined;
    onComplete: (type: TxType) => void;
}

export const MadRaffleProgramContext = createContext<MadRaffleProgramContextState>(
    {} as MadRaffleProgramContextState
);

export function useMadRaffle(): MadRaffleProgramContextState {
    return useContext(MadRaffleProgramContext);
}

export function MadRaffleProgramProvider(props: { children: ReactNode }): JSX.Element {
    const [sdk, setSdk] = useState<MadRaffleSDK>(MadRaffleSDK.dummy());
    const [nfts, setNfts] = useState<SimpleNFT[]>([]);
    const [raffle, setRaffle] = useState<Raffle | undefined>(undefined);
    
    // @ts-ignore
    const anchorWallet = window.xnft.solana as anchor.Wallet;

    const backpackConnection = useSolanaConnection();

    const connection = useMemo(() => {
      if (!backpackConnection) return undefined;
      return new Connection(backpackConnection.rpcEndpoint, backpackConnection.commitment)
    }, [backpackConnection])

    useEffect(() => {
        if(!anchorWallet) return;
        if(!connection) return;
        if(sdk.isReady()) return;
        console.log('setting sdk')
        const provider: anchor.AnchorProvider = new anchor.AnchorProvider(
            connection,
            anchorWallet,
            { commitment: 'confirmed', preflightCommitment: 'confirmed' }
        );
        const program: anchor.Program<MadRaffle> = new anchor.Program(
            IDL as unknown as MadRaffle,
            MAD_RAFFLE_PROGRAM_ID,
            provider ?? ({} as anchor.AnchorProvider)
        ); 
        setSdk(MadRaffleSDK.from(program));
    }, [anchorWallet, connection]);

    // Fetch the Current Raffle once madRaffle is ready
    // Fetch the user's NFTs once madRaffle is ready
    useEffect(() => {
        if (!sdk.isReady()) {
            console.log("Mad Raffle not ready!");
            return;
        }
        console.log(`setting raffle`)

        updateRaffle();

        if (!anchorWallet) {
            return;
        }

        updateNfts();
        
    }, [sdk]);



    function updateNfts() {
        if (!sdk.isReady()) {
            return;
        }
        if (!anchorWallet) {
            return;
        }
        sdk.fetchUserNfts().then(setNfts);
    }
    function updateRaffle() {
        if (!sdk.isReady()) {
            return;
        }
        if (!anchorWallet) {
            return;
        }
        sdk.getRaffleDetails({ current: true }).then((raffle) => {
            sdk.setCurrentRaffle({id: raffle.id, pda: raffle.pda});
            setRaffle(raffle);
        });
    }


    function onComplete(type: TxType) {
        if (!sdk.isReady()) {
            return;
        }
        if (!anchorWallet) {
            return;
        }
        if (type === TxType.SellNFT) {
            updateNfts();
        }
        updateRaffle();
    }
    
    const value: MadRaffleProgramContextState = {
        madRaffle: sdk,
        madRaffleIsReady: sdk.isReady(),
        player: anchorWallet?.publicKey,
        // @ts-ignore
        connection,
        playerNfts: nfts,
        currentRaffle: raffle,
        onComplete
    };

    return (
        <MadRaffleProgramContext.Provider value={value}>
            {props.children}
        </MadRaffleProgramContext.Provider>
    );

}

export enum TxType {
    BuyTicket,
    SellNFT
}