import * as anchor from "@project-serum/anchor";
import { IDL, MadRaffle } from "./types/types";
import { MAD_RAFFLE_PROGRAM_ID } from "./constants/id";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { MadRaffleSDK } from "./sdk";
import { PublicKey } from "@solana/web3.js";

export interface MadRaffleProgramContextState {
    madRaffle: MadRaffleSDK;
    madRaffleIsReady: boolean;
    player: PublicKey | undefined;
}

export const MadRaffleProgramContext = createContext<MadRaffleProgramContextState>(
    {} as MadRaffleProgramContextState
);

export function useMadRaffle(): MadRaffleProgramContextState {
    return useContext(MadRaffleProgramContext);
}

export function MadRaffleProgramProvider(props: { children: ReactNode }): JSX.Element {
    const [sdk, setSdk] = useState<MadRaffleSDK>(MadRaffleSDK.dummy());
    const anchorWallet = useAnchorWallet();
    const { connection } = useConnection();

    useEffect(() => {
        const provider: anchor.AnchorProvider = new anchor.AnchorProvider(
            connection,
            // fallback value allows querying the program without having a wallet connected
            anchorWallet ?? ({} as anchor.Wallet),
            { commitment: 'confirmed', preflightCommitment: 'confirmed' }
        );
        const program: anchor.Program<MadRaffle> = new anchor.Program(
            IDL as unknown as MadRaffle,
            MAD_RAFFLE_PROGRAM_ID,
            provider ?? ({} as anchor.AnchorProvider)
        );

        setSdk(MadRaffleSDK.from(program));
    }, [anchorWallet, connection, setSdk]);

    useEffect(() => {
        if (sdk.isReady()) {
            sdk.getRafflePda({ current: true }).then((raffle) => {
                sdk.setCurrentRaffle(raffle);
            });
        }
    }, [sdk]);
    
    const value: MadRaffleProgramContextState = {
        madRaffle: sdk,
        madRaffleIsReady: sdk.isReady(),
        player: anchorWallet?.publicKey,
    };

    return (
        <MadRaffleProgramContext.Provider value={value}>
            {props.children}
        </MadRaffleProgramContext.Provider>
    );

}
