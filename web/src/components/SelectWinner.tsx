import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { ComputeBudgetProgram, Transaction, TransactionSignature } from '@solana/web3.js';
import { FC, useCallback, useState } from 'react';
import { notify } from "../utils/notifications";
import { Button } from './Button';
import { useMadRaffle } from 'api/madRaffle/useMadRaffle';
import { ApiError, SolanaTxType } from 'api/madRaffle/error';

interface SelectWinnerProps {
    onSuccess?: () => void;
    startingRaffleId?: number;
}
type ChangeNumber = 'increment' | 'decrement';

export const SelectWinner: FC<SelectWinnerProps> = ({ onSuccess, startingRaffleId }) => {
    const { connection } = useConnection();
    const { publicKey: admin, signTransaction, sendTransaction } = useWallet();
    const { madRaffle } = useMadRaffle();
    const [loading, setLoading] = useState(false);
    const [ticketNumber, setTicketNumber] = useState(10);
    madRaffle.getCurrentRaffleId

    const onChangeNumber = useCallback((change: ChangeNumber) => {
        if (change === 'increment') {
            setTicketNumber(ticketNumber + 1);
        } else {
            setTicketNumber(ticketNumber - 1);
        }
    }, [ticketNumber]);
    const onClick = useCallback(async () => {
        if (!admin) {
            notify({ type: 'error', message: 'error', description: 'Wallet not connected!' });
            return;
        }

        setLoading(true);
        try {
            const transaction = new Transaction;
            const ix = await madRaffle.createSelectWinnerInstruction(ticketNumber);
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
            onWinner();
        } catch (error: any) {
            notify({ type: 'Fock!', message: `Fock! Select Winner Failed!`, description: error?.message });
        } finally {
            setLoading(false);
        }
    }, [admin, connection, madRaffle, signTransaction, sendTransaction, ticketNumber]);

    const onWinner = useCallback(async () => {
        if (!admin) {
            notify({ type: 'error', message: 'Fock! Not Authorized', description: 'Wallet not connected!' });
            return;
        }
        setLoading(true);
        try {
            const transaction = new Transaction;
            const ix = await madRaffle.createDistributePrizeInstruction(ticketNumber);
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
            notify({ type: 'Fock!', message: `Fock: Prize Failed to Send!`, description: error?.message });
        } finally {
            setLoading(false);
        }
    }, [admin, connection, madRaffle, signTransaction, sendTransaction, ticketNumber]);

    return (
        <div>
            <Button text="+1" onClick={() => onChangeNumber('increment')} loading={false} disabled={false} />
            <Button text={`Select Winner: ${ticketNumber.toString()}`} onClick={onClick} loading={loading} disabled={false} />
            <Button text="-1" onClick={() => onChangeNumber('decrement')} loading={false} disabled={false} />
        </div>
    );
};

