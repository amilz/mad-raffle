import { Loader } from "../components/Loader";
import { ComponentType, useState } from "react";
import { Image, View } from "react-native";
import { ErrorAnimation } from "./ErrorAnimation";
import { SuccessAnimation } from "./SuccessAnimation";

export interface WithAnimationsProps {
    showSuccessAnimation: () => void;
    showErrorAnimation: () => void;
    showLoadingAnimation: () => void;
}

export function withAnimations<P>(WrappedComponent: ComponentType<P & WithAnimationsProps> , loadingText: string) {
    return function (props: P) {
        const [showSuccess, setShowSuccess] = useState(false);
        const [showError, setShowError] = useState(false);
        const [showLoading, setShowLoading] = useState(false);

        const showSuccessAnimation = () => {
            setShowLoading(false);
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);                
            }, 2500);
        };

        const showErrorAnimation = () => {
            setShowLoading(false);
            setShowError(true);
            setTimeout(() => {
                setShowError(false);                
            }, 2500);
        };

        const showBody = !showError && !showSuccess && !showLoading;
        return (
            <View style={{ marginTop: 50 }}>
                <Image
                    source={require("../../assets/mad.png")}
                    style={{ width: 220, height: 220, alignSelf: 'center' }} 
                />
                <br />
                {showSuccess && <SuccessAnimation />}
                {showError && <ErrorAnimation />}
                {showLoading && <Loader displayText={loadingText} />}
        
                {showBody && <WrappedComponent
                    {...props}
                    showSuccessAnimation={showSuccessAnimation}
                    showErrorAnimation={showErrorAnimation}
                    showLoadingAnimation={()=>setShowLoading(true)}
                />}
            </View>
        );
        
    };
}
