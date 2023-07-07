import { Text, FlatList, Image } from "react-native";
import tw from "twrnc";
import { Screen } from "../components/Screen";

export function HomeScreen() {

  const features = [
    "Enter the current raffle for just 0.69 SOL",
    "Each ticket sold increases the pot",
    "Sell your Lad, claim the pot",
    "When you sell, the raffle ends, prize drops",
    "New raffle begins instantly!",
    "Earn points: buy, sell, or be early! 👀",
  ];

  return (
    <Screen
      style={tw`bg-black mt-10`}
    >
      <Image
        source={require("../../assets/tixsm.png")}
        style={{ width: 220, height: 220, alignSelf: 'center' }}
      />
      <br />
      <Text style={tw`px-4 font-bold text-white self-center text-xl`}>
        Welcome to Mad Raffle
      </Text>
      <Text style={tw`px-4 italic text-white self-center text-lg`}>
       The endless Mad Lad NFT game!
      </Text>
      <FlatList
        data={features}
        keyExtractor={(item) => item}
        renderItem={({ item }) => <Text style={tw`mb-2 text-white`}>• {item}</Text>}
        style={tw`p-4 self-center`}
      />
    </Screen>
  );
}
