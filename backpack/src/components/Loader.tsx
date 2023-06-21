import { Text, View, ActivityIndicator } from "react-native";
import tw from "twrnc";

interface LoaderProps {
    displayText?: string;
    color?: string;
    size?: number | 'small' | 'large' | undefined;
}

export function Loader({ displayText, color = "#E61A3E", size = "large" }: LoaderProps) {
    return (
        <View>
            <Text style={tw`mb-4 px-4 font-bold text-white self-center text-xl`}>
                {displayText}
            </Text>
            <ActivityIndicator size={size} color={color} />
        </View>
    );
}
