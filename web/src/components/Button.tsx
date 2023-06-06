import { FC } from 'react';
import { Spinner } from './Spinner';

interface ButtonProps {
    text: string,
    onClick: () => void,
    loading: boolean
    disabled: boolean
}

export const Button: FC<ButtonProps> = ({ text, onClick, loading, disabled }) => {
    return (
        <div className="flex flex-row justify-center " >
            <div className="relative group items-center text-black cursor-pointer" onClick={onClick}>
                <div className="m-1 absolute -inset-0.5 bg-madlad-red 
    rounded-lg blur opacity-20 group-hover:opacity-40 text-black transition duration-1000 group-hover:duration-200 animate-tilt text-black"></div>
                <button
                    className="px-8 m-2 min-w-button btn bg-madlad-red  text-black text-3xl "
                    disabled={loading || disabled}
                >
                    {loading ? <Spinner /> : <span>{text}</span>}
                </button>
            </div>
        </div>
    );
};