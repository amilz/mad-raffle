// Next, React
import { FC, useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';

// Wallet
import { useWallet } from '@solana/wallet-adapter-react';

// Components
import { BuyTicket } from '../../components/BuyTicket';
import MadRaffleLogo from '../../../public/mad.png';
import pkg from '../../../package.json';

// Store
import { SellNft } from 'components/SellNft';
import { useMadRaffle } from 'api/madRaffle/useMadRaffle';
import { Raffle } from 'api/madRaffle/types/types';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { formatNumber } from 'utils';
import { Spinner } from 'components/Spinner';
import { AUTH_PUBKEY } from 'api/madRaffle/constants/keys';
import { SelectWinner } from 'components/SelectWinner';

const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export const HomeView: FC = ({ }) => {
  const wallet = useWallet();
  const { madRaffle } = useMadRaffle();
  const [raffleDetails, setRaffleDetails] = useState<Raffle>(null);
  const [userTickets, setUserTickets] = useState<number>(0);
  const [totalTickets, setTotalTickets] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { connected } = wallet;

  useEffect(() => {
    setIsLoading(true);
    madRaffle.getRaffleDetails({ current: true }).then(details => {
      setRaffleDetails(details);
      setIsLoading(false);
    });
  }, [madRaffle])
  useEffect(() => {
    if (raffleDetails) {
      setTotalTickets(madRaffle.getTotalTickets(raffleDetails));
      if (wallet.publicKey) {
        setUserTickets(madRaffle.getUserTickets(wallet.publicKey, raffleDetails));
      }
      else { setUserTickets(0) }
    }
    else { setUserTickets(0) }
  }, [raffleDetails])

  // After buying or selling, refresh the raffle details
  // Could combine but this is easier to read and more scalable if we add more actions
  const onBuySuccess = useCallback(() => {
    madRaffle.getRaffleDetails({ current: true }).then(setRaffleDetails);
  }, [madRaffle]);
  const onSellSuccess = useCallback(() => {
    madRaffle.getRaffleDetails({ current: true }).then(setRaffleDetails);
  }, [madRaffle]);

  const solPriceString = raffleDetails ? (formatNumber(raffleDetails.availableLamports / LAMPORTS_PER_SOL)).toString() : '0';
  const showSellNftButton = raffleDetails && totalTickets > 0;
  const ticketsString = totalTickets > 0 ? `You have ${userTickets} of ${totalTickets} tickets.` : 'No tickets sold yet.';
  return (

    <div className="md:hero mx-auto p-4">
      <div className="hero-content flex flex-col">
        <div className=''>
          <Image src={MadRaffleLogo} alt={'test'} width={200} height={200} />
        </div>

        {!connected ?
          <div className='flex flex-col items-center justify-center'>
            <p className='max-w-md text-2xl text-left md:mr-0 text-slate-400'>
              mad raffle is a "reverse", perpetual raffle.
              at any given time there's always 1 raffle open for any mad lad NFT.<br />
              <ul className="list-disc list-outside pl-6">
                <li>ticket costs 0.69 sol.</li>
                <li>the raffle pot grows each time somebody buys a ticket.</li>
                <li>at any point, anybody can sell a madlad to the raffle to take the pot.</li>
                <li>that ends the raffle. a winner is selected. prize dropped. and next raffle starts.</li>
              </ul>
            </p><br />
            <WalletMultiButtonDynamic className="px-8 m-2 min-w-button btn bg-gradient-to-br from-red-800 to-red-500 hover:bg-white hover:text-black focus:bg-white focus:text-red-800 text-black text-xl " />
          </div>
          : <div>
            <h4 className="md:w-full text-2xl md:text-4xl text-center text-slate-300 my-2">
              {isLoading
                ? <Spinner />
                : (
                  <>
                    {raffleDetails !== null && raffleDetails !== undefined &&
                      <p>Current Raffle: {raffleDetails.id.toString()}.</p>}
                    {userTickets !== null && userTickets !== undefined &&
                      <p>{ticketsString}</p>}
                  </>
                )
              }

            </h4>

            <div className="flex flex-col mt-2">
              <BuyTicket onSuccess={onBuySuccess} />
              {showSellNftButton && <SellNft
                solPriceString={solPriceString}
                onSuccess={onSellSuccess}
              />}
              {wallet && wallet.publicKey && wallet.publicKey.toBase58() === AUTH_PUBKEY.toBase58() &&
                <>
                  <SelectWinner />
                </>
              }
            </div>
          </div>}
      </div>
    </div>
  );
};
