// Next, React
import { FC,  useEffect, useState } from 'react';

// Wallet
import { useWallet } from '@solana/wallet-adapter-react';

// Components
import pkg from '../../../package.json';

// Store
import { useMadRaffle } from 'api/madRaffle/useMadRaffle';
import { LocalRaffle } from 'api/madRaffle/sdk';
import { formatPublicKey } from 'utils';


export const HistoryView: FC = ({ }) => {
  const wallet = useWallet();
  const { madRaffle } = useMadRaffle();
  const [history, setHistory] = useState<LocalRaffle[]>([]);


  useEffect(() => {
    if (madRaffle) {
      //TODO(amilz) add checks to prevent from running too often
      madRaffle.updateRaffleHistory().then(setHistory);
    }
  }, [madRaffle])


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
          Raffle History
        </h4>
        <div className="flex flex-col mt-2 text-2xl">
          <table className="table-auto border-collapse border border-gray-300 tracking-wide ">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2">ID</th>
                <th className="border border-gray-300 p-2">Winner</th>
                <th className="border border-gray-300 p-2">Prize Claimed</th>
              </tr>
            </thead>
            <tbody>
              {history.map((raffle) => (
                <tr key={raffle.id}>
                  <td className="border border-gray-300 p-2">{raffle.id}</td>
                  <td className="border border-gray-300 p-2">{formatPublicKey(raffle.winner?.toString() || '')}</td>
                  <td className="border border-gray-300 p-2">{raffle.claimed ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};





