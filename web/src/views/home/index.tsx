// Next, React
import { FC, useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';

// Wallet
import { useWallet } from '@solana/wallet-adapter-react';

// Components
import { BuyTicket } from '../../components/BuyTicket';
import MadRaffleLogo from '../../../public/mad.png';

// Store
import { SellNft } from 'components/SellNft';
import { useMadRaffle } from 'api/madRaffle/useMadRaffle';
import { Raffle } from 'api/madRaffle/types/types';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { formatNumber, padWithLeadingZeros } from 'utils';
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
  const [showBuyTicketButton, setShowBuyTicketButton] = useState(true);
  const [buyingTicket, setBuyingTicket] = useState(false);
  const [restart, setRestart] = useState(false);
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
    setBuyingTicket(false);
  }, [madRaffle]);
  const onBuyError = useCallback(() => {
    setBuyingTicket(false);
  }, [madRaffle]);
  const onSellSuccess = useCallback(() => {
    madRaffle.getRaffleDetails({ current: true }).then(setRaffleDetails);
    setShowBuyTicketButton(true);
  }, [madRaffle]);
  const onCancelSell = useCallback(() => {
    setShowBuyTicketButton(true);
    setRestart(prevState => !prevState);
  }, []);

  const solPriceString = raffleDetails ? (formatNumber(raffleDetails.availableLamports / LAMPORTS_PER_SOL)).toString() : '0';
  const showSellNftButton = raffleDetails && totalTickets > 0 && !buyingTicket;
  const ticketsString = totalTickets > 0 ? `You have ${userTickets} of ${totalTickets} tickets.` : 'No tickets sold yet.';
  const adminTicketDefault = (raffleDetails !== null && raffleDetails !== undefined && raffleDetails.id !== null && raffleDetails.id !== undefined) ? raffleDetails.id : 0;
  return (

    <div className="md:hero mx-auto">
      <div className="hero-content flex flex-col">
        <div className=''>
          <Image src={MadRaffleLogo} alt={'Mad Raffle Logo'} width={200} height={200} />
        </div>

        {!connected ?
          <div className='flex flex-col items-center justify-center'>
<div className='max-w-md text-2xl text-left md:mr-0 text-slate-400 mx-4 sm:mx-0'>
Welcome to Mad Raffle - the endless Mad Lad NFT game!<br />
  <ul className="list-disc list-outside pl-6">
    <li>Enter the current raffle for just 0.69 SOL</li>
    <li>Each ticket sold increases the pot</li>
    <li>Sell your Lad, claim the pot</li>
    <li>When you sell, the raffle ends, prize drops</li>
    <li>New raffle begins instantly!</li>
    <li>Earn points: buy, sell, or be early! 👀</li>
  </ul>
</div><br />

            <WalletMultiButtonDynamic
              className="px-8 m-2 min-w-button btn bg-madlad-red 
              hover:bg-madlad-red hover:text-black
              focus:bg-madlad-red focus:text-black
              text-black text-xl"
            />
          </div>
          : <div>
            <h4 className="md:w-full text-2xl md:text-4xl text-center text-slate-300 my-2">
              {isLoading
                ? (
                  <div className="flex justify-center items-center">
                    <Spinner color='text-madlad-red' />
                  </div>
                )
                : (
                  <>
                    {raffleDetails !== null && raffleDetails !== undefined &&
                      <p>Current Raffle: {padWithLeadingZeros(raffleDetails.id)}</p>}
                    {showBuyTicketButton && userTickets !== null && userTickets !== undefined &&
                      <p>{ticketsString}</p>}
                    {raffleDetails !== null && raffleDetails !== undefined &&
                      <p>Current Pot: ◎{solPriceString}</p>}
                    {!showBuyTicketButton &&
                      <p className='font-bold'>Select Lad to Sell: <span onClick={() => onCancelSell()} className='text-base text-madlad-red'>(cancel)</span></p>}
                  </>
                )
              }

            </h4>

            <div className="flex flex-col mt-2">
              {showBuyTicketButton && <BuyTicket
                onSuccess={onBuySuccess}
                onClickButton={() => setBuyingTicket(true)}
                onError={onBuyError}
              />}
              {showSellNftButton && <SellNft
                solPriceString={solPriceString}
                onSuccess={onSellSuccess}
                onClickButton={() => setShowBuyTicketButton(false)}
                restart={restart}
                onError={onCancelSell}
              />}
              {wallet && wallet.publicKey && wallet.publicKey.toBase58() === AUTH_PUBKEY.toBase58() &&
                <>
                  <SelectWinner startingRaffleId={adminTicketDefault} />
                </>
              }
            </div>
          </div>}
      </div>
    </div>
  );
};
