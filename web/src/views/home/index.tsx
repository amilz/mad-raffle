// Next, React
import { FC, useCallback, useEffect, useState } from 'react';

// Wallet
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

// Components
import { BuyTicket } from '../../components/BuyTicket';
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
import { DistributePrize } from 'components/DistributePrize';

export const HomeView: FC = ({ }) => {
  const wallet = useWallet();
  const { madRaffle } = useMadRaffle();
  const [raffleDetails, setRaffleDetails] = useState<Raffle>(null);
  const [userTickets, setUserTickets] = useState<number>(0);
  const [totalTickets, setTotalTickets] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);


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
      <div className="md:hero-content flex flex-col">
        <div className='mt-6'>
          <h1 className="text-center italic text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-red-800 to-red-500 ">
            MAD RAFFLE
          </h1>
          <div className='text-2xl font-bold align-bottom text-right mr-16 md:text-center md:mr-0 text-slate-400'>v{pkg.version}</div>

        </div>
        <h4 className="md:w-full text-2xl md:text-4xl text-center text-slate-300 my-2">
          {isLoading
            ? <Spinner />  // Replace with your spinner component
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
              <DistributePrize />
            </>
          }
        </div>
      </div>
    </div>
  );
};
