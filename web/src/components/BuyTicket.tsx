import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction, TransactionSignature } from '@solana/web3.js';
import { FC, useCallback, useState } from 'react';
import { notify } from "../utils/notifications";
import { Button } from './Button';
import { useMadRaffle } from 'api/madRaffle/useMadRaffle';
import { ApiError, SolanaTxType } from 'api/madRaffle/error';

interface BuyTicketProps {
    onSuccess: () => void;
    onClickButton: () => void;
    onError: () => void;
}

export const BuyTicket: FC<BuyTicketProps> = ({ onSuccess, onClickButton, onError }) => {
    const { connection } = useConnection();
    const { publicKey: buyer, signTransaction, sendTransaction } = useWallet();
    const { madRaffle } = useMadRaffle();

    const [loading, setLoading] = useState(false);


    const onClick = useCallback(async () => {
        if (!buyer) {
            notify({ type: 'error', message: 'error', description: 'Wallet not connected!' });
            return;
        }
        setLoading(true);
        onClickButton();
        try {
            const transaction = new Transaction;
            const ix = await madRaffle.createBuyTicketInstruction();
            if (!ix) { ApiError.solanaTxError(SolanaTxType.FAILED_TO_GENERATE_IX) }

            let { lastValidBlockHeight, blockhash } = await connection.getLatestBlockhash('finalized');
            transaction.add(ix);
            transaction.recentBlockhash = blockhash;
            transaction.lastValidBlockHeight = lastValidBlockHeight;
            transaction.feePayer = buyer;
            const signature: TransactionSignature = await sendTransaction(transaction, connection);

            const results = await connection.confirmTransaction({ signature, lastValidBlockHeight, blockhash }, 'confirmed');
            if (results.value.err) {
                ApiError.solanaTxError(SolanaTxType.FAILED_TO_CONFIRM);
            }
            notify({ type: 'Focking Mad!', message: 'Buy Ticket Success!', txid: signature });
            onSuccess();
        } catch (error: any) {
            notify({ type: 'Fock!', message: `Buy Ticket Failed!`, description: error?.message });
            onError();
        } finally {
            setLoading(false);
        }
    }, [buyer, connection, madRaffle, signTransaction, sendTransaction]);

    return (
        <Button text="Buy Ticket ◎0.69" onClick={onClick} loading={loading} disabled={!buyer}/>
    );
};

