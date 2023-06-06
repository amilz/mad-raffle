// Next, React
import { FC, useEffect, useState } from 'react';
import Image from 'next/image';

// Wallet
import { useWallet } from '@solana/wallet-adapter-react';

// Components
import MadRaffleLogo from '../../../public/mad.png';

// Store
import { useMadRaffle } from 'api/madRaffle/useMadRaffle';
import { formatPublicKey } from 'utils';
import { Spinner } from 'components/Spinner';
import { ScoreboardEntry } from 'api/madRaffle/types/types';

const LEADERBOARD_SIZE = 10;
interface RankedScoreBoardEntry extends ScoreboardEntry {
  rank: number;
}

export const ScoreboardView: FC = ({ }) => {
  const { publicKey } = useWallet();
  const { madRaffle } = useMadRaffle();
  const [loading, setLoading] = useState(false);
  const [scoreboard, setScoreboard] = useState<RankedScoreBoardEntry[]>([]);
  const [displayedScoreboard, setDisplayedScoreboard] = useState<RankedScoreBoardEntry[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (madRaffle) {
        setLoading(true);
        madRaffle.getScoreBoard()
          .then(scoreboard => {
            const rankedScores = scoreboard
              .sort((a, b) => b.points - a.points)
              .map((score, index) => ({ ...score, rank: index + 1 }));
            setScoreboard(rankedScores);
            setDisplayedScoreboard(rankedScores.slice(0, LEADERBOARD_SIZE));
          })
          .then(() => setLoading(false));
      }
    };
    fetchHistory();
  }, [madRaffle]);

  useEffect(() => {
    if (publicKey) {
      const userScore = scoreboard.find(score => score.user.toBase58() === publicKey.toBase58());
      if (userScore) {
        setDisplayedScoreboard(prev => {
          // removes the user's score from the leaderboard if present and adds the new score
          const scoresWithoutUser = prev.filter(score => score.user.toBase58() !== publicKey.toBase58());
          const result = [...scoresWithoutUser, userScore].sort((a, b) => a.rank - b.rank);
          return result;
        });
      }
    }
  }, [scoreboard, publicKey]);


  return (

    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col items-center justify-center">
        <div className=''>
          <Image src={MadRaffleLogo} alt={'Mad Raffle Logo'} width={150} height={150} />
        </div>

        <h4 className="md:w-full text-2xl md:text-4xl text-center text-slate-300 my-2">
          Leaderboard
        </h4>
        <div className="flex flex-col mt-2 text-2xl">
          {loading ? <Spinner /> :
            <table className="table-auto border-collapse border border-gray-300 tracking-wide text-center">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-2">Rank</th>
                  <th className="border border-gray-300 p-2">PubKey</th>
                  <th className="border border-gray-300 p-2">Points</th>
                </tr>
              </thead>
              <tbody>
                {displayedScoreboard.map((entry, index) => (
                  <tr key={index} className={publicKey && entry.user.toString() === publicKey.toString() ? 'bg-madlad-red text-black font-bold' : ''}>
                    <td className="border border-gray-300 p-1">{entry.rank}</td>
                    <td className="border border-gray-300 p-1">{formatPublicKey(entry.user.toString())}</td>
                    <td className="border border-gray-300 p-1">{entry.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>}
        </div>

      </div>
    </div>
  );
};





