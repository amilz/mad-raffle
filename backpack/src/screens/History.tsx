import { useEffect, useState } from "react";
import { Text, Image, View, ScrollView } from "react-native";
import tw from "twrnc";
import { Loader } from "../components/Loader";
import { Screen } from "../components/Screen";
import { LocalRaffle } from "../madRaffle/sdk";
import { useMadRaffle } from "../madRaffle/useMadRaffle";
import { formatPublicKey } from "../utils";

export function HistoryScreen() {
    const {
        madRaffle,
        player,
    } = useMadRaffle();
    const [history, setHistory] = useState<LocalRaffle[]>([]);
    const [sdkLoaded, setSdkLoaded] = useState(false);
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        let isMounted = true;
        const fetchHistory = async () => {
            if (madRaffle && madRaffle.isReady()) {
                // Only fetch history if madRaffle has changed
                setLoading(true);
                console.log("LOGGING HISTORY")
                let newHistory = await madRaffle.updateRaffleHistory();
                let sortedHistory = newHistory.sort((a, b) => b.id - a.id);
                if (isMounted) {  // check if component is still mounted
                    setHistory(sortedHistory);
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




    // ...

    return (
        <Screen style={tw`bg-black mt-10`}>
            <Image
                source={require("../../assets/mad.png")}
                style={{ width: 220, height: 220, alignSelf: 'center' }}
            />
            <Text style={tw`px-4 font-bold text-white self-center text-xl mt-4`}>
                Raffle History
            </Text>
            <View style={tw`border border-gray-500 mt-4 mx-4`}>
                <View style={tw`bg-gray-700 border-b border-gray-500 flex-row justify-between p-2 items-end`}>
                    <View style={tw`w-16`}><Text style={tw`text-white font-bold text-center`}>ID</Text></View>
                    <Text style={tw`text-white font-bold`}>Winner</Text>
                    <View style={tw`w-24`}><Text style={tw`text-white font-bold text-center`}>Prize Claimed</Text></View>
                </View>
            </View>

            
            {loading ? <Loader /> : <ScrollView
                indicatorStyle={'white'}
                showsVerticalScrollIndicator={false}
            >
                <View style={tw`border border-gray-500 mb-4 mx-4`}>
                    {history.map((raffle, index) => (
                        <View
                            key={index}
                            style={tw`flex-row justify-between border-b border-gray-500 p-2`}
                        >
                            <View style={tw`w-16`}><Text style={tw`text-gray-500 text-center`}>{raffle.id}</Text></View>
                            <Text style={tw`text-gray-500`}>{formatPublicKey(raffle.winner?.toString() || '')}</Text>
                            <View style={tw`w-24`}>
                                <Text style={tw`text-gray-500 text-center`}>{raffle.claimed ? 'Yes' : 'No'}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>}
        </Screen>
    );




}
