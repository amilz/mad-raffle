import { FC, useCallback, useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { notify } from "../utils/notifications";
import { Button } from './Button';
import { useMadRaffle } from 'api/madRaffle/useMadRaffle';
import { SimpleNFT } from 'api/madRaffle/sdk';
import { ComputeBudgetProgram, Transaction, TransactionSignature } from '@solana/web3.js';
import { ApiError, SolanaTxType } from 'api/madRaffle/error';


interface NFTComponentProps {
  nft: SimpleNFT;
  onSelect: (nft: SimpleNFT) => void;
  selected: boolean;
}

const NFTComponent: FC<NFTComponentProps> = ({ nft, onSelect, selected }) => {
  return (
    <div
      onClick={() => onSelect(nft)}
      className={`relative border-solid border-2 rounded-md group
            ${selected ? 'border-madlad-red bg-madlad-red' : 'border-slate-800'}`}
    >
      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10" />
      <img src={nft.image} alt={nft.name} className='aspect-square object-cover rounded-t' height={'auto'} />
      <div className={`w-full text-center rounded-b text-2xl ${selected ? 'bg-madlad-red text-black font-bold' : 'bg-neutral-900'}`}>
        {nft.name}
      </div>
      <div className={`absolute top-2 right-2 h-4 w-4 rounded-full border-solid border-2 border-black ${selected ? 'bg-madlad-red' : ''}`}></div>
    </div>

  )
}


interface SellNftProps {
  solPriceString: string;
  onSuccess: () => void;
  onClickButton: () => void;
  restart: boolean;
  onError: () => void;
}

export const SellNft: FC<SellNftProps> = ({ solPriceString, onSuccess, onClickButton, restart, onError }) => {
  const { publicKey: seller, sendTransaction } = useWallet();
  const { madRaffle } = useMadRaffle();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [nfts, setNfts] = useState<SimpleNFT[]>([]);
  const [selectedNft, setSelectedNft] = useState<SimpleNFT>(null);
  const [selectingNft, setSelectingNft] = useState(false);

  // Fetch NFTs
  useEffect(() => {
    if (!seller) return;
    console.log("fetching nfts");
    madRaffle.fetchUserNfts().then(setNfts);
  }, [seller, madRaffle]);

  const onClick = useCallback(async () => {
    if (!selectedNft) {
      notify({ type: 'Fock!', message: `No NFT Selected!`, description: 'Please select an NFT to sell.' });
      return;
    }
    setLoading(true);
    try {
      // Sell the selected NFT
      const transaction = new Transaction;
      const ix = await madRaffle.createEndRaffleInstruction(selectedNft.mint); // assuming sellNft method exists

      if (!ix) {
        ApiError.solanaTxError(SolanaTxType.FAILED_TO_GENERATE_IX);
      }

      let { lastValidBlockHeight, blockhash } = await connection.getLatestBlockhash('finalized');
      transaction.add(ix);
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = seller;
      transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 1000000 }))

      const signature: TransactionSignature = await sendTransaction(transaction, connection);

      const results = await connection.confirmTransaction({ signature, lastValidBlockHeight, blockhash }, 'confirmed');
      if (results.value.err) {
        ApiError.solanaTxError(SolanaTxType.FAILED_TO_CONFIRM);
      }
      notify({ type: 'Focking Mad!', message: 'Your Lad has Sold!', txid: signature });
      onSuccess();
    } catch (error) {
      notify({ type: 'Fock!', message: `Sell NFT Failed!`, description: error?.message });
      onError();
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [selectedNft, madRaffle]);
  const onNftClick = useCallback((nft: SimpleNFT) => {
    if (selectedNft === nft) {
      setSelectedNft(null);
      return;
    }
    setSelectedNft(nft);
  }, [selectedNft]);

  const onShowNfts = useCallback(() => {
    onClickButton();
    setSelectingNft(true);
    return;
  }, []);
  useEffect(() => {
    setSelectedNft(null);
    setSelectingNft(false);
  }, [restart]);

  const buttonText = nfts.length <= 0 ? `No Focking Lads` : !selectingNft ? `Sell a Lad ◎${solPriceString}` : `Sell Now ◎${solPriceString}`;
  return (
    <div>
      {!selectingNft && <Button text={buttonText} onClick={onShowNfts} loading={false} disabled={nfts.length <= 0} />}
      <div className="flex flex-wrap justify-center">
        {selectingNft && nfts && nfts.map(nft =>
          <div
            className={`w-1/3 sm:w-1/3 md:w-1/3 lg:w-1/4 xl:w-1/4 2xl:w-1/6 p-2`}
            key={nft.mint.toBase58()}
          >
            <NFTComponent nft={nft} onSelect={onNftClick} selected={nft === selectedNft} />
          </div>
        )}

      </div>
      {selectedNft && <div> <Button text={buttonText} onClick={onClick} loading={loading} disabled={false} /></div>}
    </div>
  );
};
