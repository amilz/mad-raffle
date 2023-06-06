import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { ComputeBudgetProgram, Transaction, TransactionSignature } from '@solana/web3.js';
import { FC, useCallback, useState } from 'react';
import { notify } from "../utils/notifications";
import { Button } from './Button';
import { useMadRaffle } from 'api/madRaffle/useMadRaffle';
import { ApiError, SolanaTxType } from 'api/madRaffle/error';

interface SelectWinnerProps {
    onSuccess?: () => void;
    currentRaffleId?: number;
}
type ChangeNumber = 'increment' | 'decrement';

export const SelectWinner: FC<SelectWinnerProps> = ({ onSuccess, currentRaffleId }) => {
    const { connection } = useConnection();
    const { publicKey: admin, signTransaction, sendTransaction } = useWallet();
    const { madRaffle } = useMadRaffle();
    const [loading, setLoading] = useState(false);
    const [ticketNumber, setTicketNumber] = useState((currentRaffleId-1) ?? 0);
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
            //TODO add form for ticket number
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
            notify({ type: 'Fock!', message: `Buy Ticket Failed!`, description: error?.message });
        } finally {
            setLoading(false);
        }
    }, [admin, connection, madRaffle, signTransaction, sendTransaction]);

    const onWinner = useCallback(async () => {
        if (!admin) {
            notify({ type: 'error', message: 'error', description: 'Wallet not connected!' });
            return;
        }
        setLoading(true);
        try {
            const transaction = new Transaction;
            //TODO add form for ticket number
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
            notify({ type: 'Fock!', message: `Buy Ticket Failed!`, description: error?.message });
        } finally {
            setLoading(false);
        }
    }, [admin, connection, madRaffle, signTransaction, sendTransaction]);

    return (
        <div>
            <Button text="+1" onClick={()=>onChangeNumber('increment')} loading={false} disabled={false}/>
            <Button text={`Select Winner: ${ticketNumber.toString()}`} onClick={onClick} loading={loading} disabled={false}/>
            <Button text="-1" onClick={()=>onChangeNumber('decrement')} loading={false} disabled={false}/>
        </div>
    );
};

