import { AntDesign } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { View, Animated, Text } from "react-native";
import tw from "twrnc";



export function SuccessAnimation() {

    const scaleValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.timing(scaleValue, {
                toValue: 1.2,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(scaleValue, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={tw`mb-4 px-4 font-bold text-white self-center text-xl`}>
                LFG 🚀
            </Text>
            <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
                <AntDesign name="check" size={96} color="#E61A3E" />
            </Animated.View>
        </View>
    );
}
