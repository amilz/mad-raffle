import { registerRootComponent } from "expo";
import { RecoilRoot } from "recoil";
import { ActivityIndicator, View } from "react-native";
import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFonts, Inter_900Black } from "@expo-google-fonts/dev";
import { HomeScreen } from "./screens/HomeScreen";
import { RaffleScreen } from "./screens/RaffleScreen";
import { MadRaffleProgramProvider } from "./madRaffle/useMadRaffle";
import { SellScreen } from "./screens/SellScreen";
import { ScoreBoardScreen } from "./screens/ScoreBoard";
import { HistoryScreen } from "./screens/History";
import { BuyTicketScreen } from "./screens/BuyTicketScreen";
import { SellLadScreen } from "./screens/SellLadScreen";
global.Buffer = require('buffer').Buffer;

const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: "#E61A3E",
        tabBarStyle: {
          backgroundColor: "#000",
          borderTopColor: "gray",
          padding: 10,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Raffle"
        component={BuyTicketScreen}
        options={{
          tabBarLabel: "Buy Tickets",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="ticket" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Sell"
        component={SellLadScreen}
        options={{
          tabBarLabel: "Sell Lad",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cash-register" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={ScoreBoardScreen}
        options={{
          tabBarLabel: "Leaderboard",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="scoreboard" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: "History",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="history" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function App() {
  let [fontsLoaded] = useFonts({
    Inter_900Black,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <MadRaffleProgramProvider>
      <RecoilRoot>

        <NavigationContainer theme={DarkTheme} >
          <TabNavigator />
        </NavigationContainer>

      </RecoilRoot>
    </MadRaffleProgramProvider>

  );
}

export default registerRootComponent(App);