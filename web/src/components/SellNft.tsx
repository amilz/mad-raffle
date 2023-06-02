import { FC, useCallback, useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { notify } from "../utils/notifications";
import { Button } from './Button';
import { useMadRaffle } from 'api/madRaffle/useMadRaffle';
import { SimpleNFT } from 'api/madRaffle/sdk';
import { ComputeBudgetProgram, Transaction, TransactionSignature } from '@solana/web3.js';
import { ApiError, SolanaTxType } from 'api/madRaffle/error';


const NFTComponent: FC<{ nft: SimpleNFT, onSelect: (nft: SimpleNFT) => void }> = ({ nft, onSelect }) => {
  return (
    <div onClick={() => onSelect(nft)}>
      <img src={nft.image} alt={nft.name} />
    </div>
  )
}

interface SellNftProps {
  solPriceString: string;
  onSuccess: () => void;
}

export const SellNft: FC<SellNftProps> = ({ solPriceString, onSuccess }) => {
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
    setSelectingNft(true);
    return;
  }, []);
  const buttonText = nfts.length <= 0 ? `No Focking Lads` : !selectingNft ? `Sell a Lad ◎${solPriceString}` : `Sell Now ◎${solPriceString}`;
  return (
    <div>
      {!selectingNft && <Button text={buttonText} onClick={onShowNfts} loading={false} disabled={nfts.length <= 0} />}
      <div className="flex flex-wrap justify-center">
        {selectingNft && nfts && nfts.map(nft =>
          <div
            className={`w-1/3 sm:w-1/3 md:w-1/3 lg:w-1/4 xl:w-1/4 2xl:w-1/6 p-4 ${nft === selectedNft ? 'border-yellow-500 border-2' : ''}`}
            key={nft.mint.toBase58()}
          >
            <NFTComponent nft={nft} onSelect={onNftClick} />
          </div>
        )}

      </div>
      {selectedNft && <div> <Button text={buttonText} onClick={onClick} loading={loading} disabled={false} /></div>}
    </div>
  );
};
