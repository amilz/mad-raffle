import { useEffect, useState } from "react";
import { Text, Image, View, ScrollView } from "react-native";
import tw from "twrnc";
import { Loader } from "../components/Loader";
import { Screen } from "../components/Screen";
import { ScoreboardEntry } from "../madRaffle/types/types";
import { useMadRaffle } from "../madRaffle/useMadRaffle";
import { formatPublicKey } from "../utils";

const LEADERBOARD_SIZE = 10;
interface RankedScoreBoardEntry extends ScoreboardEntry {
    rank: number;
}

export function ScoreBoardScreen() {
    const {
        madRaffle,
        player,
    } = useMadRaffle();
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
        if (player) {
            const userScore = scoreboard.find(score => score.user.toBase58() === player.toBase58());
            if (userScore) {
                setDisplayedScoreboard(prev => {
                    // removes the user's score from the leaderboard if present and adds the new score
                    const scoresWithoutUser = prev.filter(score => score.user.toBase58() !== player.toBase58());
                    const result = [...scoresWithoutUser, userScore].sort((a, b) => a.rank - b.rank);
                    return result;
                });
            }
        }
    }, [scoreboard, player]);





    return (
        <Screen style={tw`bg-black mt-10`}>
            <Image
                source={require("../../assets/tixsm.png")}
                style={{ width: 220, height: 220, alignSelf: 'center' }}
            />
            <Text style={tw`px-4 font-bold text-white self-center text-xl mt-4`}>
                Leaderboard
            </Text>

            <View style={tw`border border-gray-500 mt-4 mx-4`}>
                <View style={tw`bg-gray-700 border-b border-gray-500 flex-row justify-between p-2 items-end`}>
                    <View style={tw`w-16`}><Text style={tw`text-white font-bold text-center`}>Rank</Text></View>
                    <Text style={tw`text-white font-bold`}>PubKey</Text>
                    <View style={tw`w-24`}><Text style={tw`text-white font-bold text-center`}>Points</Text></View>
                </View></View>
            {loading ? <Loader /> : <ScrollView
                indicatorStyle={'white'}
                showsVerticalScrollIndicator={false}
            >
                <View style={tw`border border-gray-500 mb-4 mx-4`}>

                    {displayedScoreboard.map((entry, index) => (
                        <View
                            key={index}
                            style={tw`flex-row justify-between border-b border-gray-500 p-2 ${player && entry.user.toString() === player.toString() ? 'bg-gray-200' : ''}`}
                        >
                            <View style={tw`w-16`}><Text style={tw`text-gray-500 text-center`}>{entry.rank}</Text></View>
                            <Text style={tw`text-gray-500`}>{formatPublicKey(entry.user.toString())}</Text>
                            <View style={tw`w-24`}><Text style={tw`text-gray-500 text-center`}>{entry.points}</Text></View>
                        </View>
                    ))}
                </View>
            </ScrollView>}
        </Screen>
    );

}
