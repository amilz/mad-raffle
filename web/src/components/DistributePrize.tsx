import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { ComputeBudgetProgram, Transaction, TransactionSignature } from '@solana/web3.js';
import { FC, useCallback, useState } from 'react';
import { notify } from "../utils/notifications";
import { Button } from './Button';
import { useMadRaffle } from 'api/madRaffle/useMadRaffle';
import { ApiError, SolanaTxType } from 'api/madRaffle/error';

interface DistributePrizeProps {
    onSuccess?: () => void;
}

export const DistributePrize: FC<DistributePrizeProps> = ({ onSuccess }) => {
    const { connection } = useConnection();
    const { publicKey: admin, signTransaction, sendTransaction } = useWallet();
    const { madRaffle } = useMadRaffle();

    const [loading, setLoading] = useState(false);


    const onClick = useCallback(async () => {
        if (!admin) {
            notify({ type: 'error', message: 'error', description: 'Wallet not connected!' });
            return;
        }
        setLoading(true);
        try {
            const transaction = new Transaction;
            //TODO add form for ticket number
            const ix = await madRaffle.createDistributePrizeInstruction(3);
            if (!ix) { ApiError.solanaTxError(SolanaTxType.FAILED_TO_GENERATE_IX) }

            let { lastValidBlockHeight, blockhash } = await connection.getLatestBlockhash('finalized');
            transaction.add(ix);
            transaction.recentBlockhash = blockhash;
            transaction.lastValidBlockHeight = lastValidBlockHeight;
            transaction.feePayer = admin;
            transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 1000000 }))

            const signature: TransactionSignature = await sendTransaction(transaction, connection);

            const results = await connection.confirmTransaction({ signature, lastValidBlockHeight, blockhash }, 'confirmed');
            if (results.value.err) {
                ApiError.solanaTxError(SolanaTxType.FAILED_TO_CONFIRM);
            }
            notify({ type: 'Focking Mad!', message: 'Prize Sent!', txid: signature });

        } catch (error: any) {
          console.error(error);
            notify({ type: 'Fock!', message: `Buy Ticket Failed!`, description: error?.message });
        } finally {
            setLoading(false);
        }
    }, [admin, connection, madRaffle, signTransaction, sendTransaction]);

    return (
        <Button text="Distribute Prize" onClick={onClick} loading={loading} disabled={false}/>
    );
};

