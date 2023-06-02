import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction, TransactionSignature } from '@solana/web3.js';
import { FC, useCallback, useState } from 'react';
import { notify } from "../utils/notifications";
import { Button } from './Button';
import { useMadRaffle } from 'api/madRaffle/useMadRaffle';
import { ApiError, SolanaTxType } from 'api/madRaffle/error';

interface SelectWinnerProps {
    onSuccess?: () => void;
}

export const SelectWinner: FC<SelectWinnerProps> = ({ onSuccess }) => {
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
            const ix = await madRaffle.createSelectWinnerInstruction(3);
            if (!ix) { ApiError.solanaTxError(SolanaTxType.FAILED_TO_GENERATE_IX) }

            let { lastValidBlockHeight, blockhash } = await connection.getLatestBlockhash('finalized');
            transaction.add(ix);
            transaction.recentBlockhash = blockhash;
            transaction.lastValidBlockHeight = lastValidBlockHeight;
            transaction.feePayer = admin;
            const signature: TransactionSignature = await sendTransaction(transaction, connection);

            const results = await connection.confirmTransaction({ signature, lastValidBlockHeight, blockhash }, 'confirmed');
            if (results.value.err) {
                ApiError.solanaTxError(SolanaTxType.FAILED_TO_CONFIRM);
            }
            notify({ type: 'Focking Mad!', message: 'Winner Selected!', txid: signature });

        } catch (error: any) {
            notify({ type: 'Fock!', message: `Buy Ticket Failed!`, description: error?.message });
        } finally {
            setLoading(false);
        }
    }, [admin, connection, madRaffle, signTransaction, sendTransaction]);

    return (
        <Button text="Select Winner" onClick={onClick} loading={loading} disabled={false}/>
    );
};

