import { FC } from 'react';
import { SimpleNFT } from '../madRaffle/sdk';


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