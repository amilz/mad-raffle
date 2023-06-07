// Next, React
import { FC, useEffect, useState } from 'react';
import Image from 'next/image';

// Wallet
import { useWallet } from '@solana/wallet-adapter-react';

// Components
import MadRaffleLogo from '../../../public/mad.png';

// Store
import { useMadRaffle } from 'api/madRaffle/useMadRaffle';
import { LocalRaffle } from 'api/madRaffle/sdk';
import { formatPublicKey } from 'utils';
import { Spinner } from 'components/Spinner';


export const HistoryView: FC = ({ }) => {
  const wallet = useWallet();
  const { madRaffle } = useMadRaffle();
  const [history, setHistory] = useState<LocalRaffle[]>([]);
  const [loading, setLoading] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);


  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      if (madRaffle && madRaffle.isReady()) {
        // Only fetch history if madRaffle has changed
        setLoading(true);
        console.log("LOGGING HISTORY")
        let newHistory = await madRaffle.updateRaffleHistory();
        if (isMounted) {  // check if component is still mounted
          setHistory(newHistory);
          setLoading(false);
        }
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [sdkLoaded]);


  useEffect(() => {
    if (madRaffle && madRaffle.isReady() && !sdkLoaded) {
      setSdkLoaded(true);
    }
  }, [madRaffle]);



  return (

    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col items-center justify-center">
        <div className=''>
          <Image src={MadRaffleLogo} alt={'Mad Raffle Logo'} width={150} height={150} />
        </div>
        <h4 className="md:w-full text-2xl md:text-4xl text-center text-slate-300 my-2">
          Raffle History
        </h4>
        <div className="flex flex-col mt-2 text-2xl">
          {loading ? <Spinner color='text-madlad-red' /> :
            <table className="table-auto border-collapse border border-gray-300 tracking-wide text-center">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-2">ID</th>
                  <th className="border border-gray-300 p-2">Winner</th>
                  <th className="border border-gray-300 p-2">Prize Claimed</th>
                </tr>
              </thead>
              <tbody>
                {history && history.map((raffle) => (
                  <tr key={raffle.id}>
                    <td className="border border-gray-300 p-1">{raffle.id}</td>
                    <td className="border border-gray-300 p-1">{formatPublicKey(raffle.winner?.toString() || '')}</td>
                    <td className="border border-gray-300 p-1">{raffle.claimed ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>}
        </div>
      </div>
    </div>
  );
};





