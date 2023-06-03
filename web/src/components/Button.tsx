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
        <div className="flex flex-row justify-center cursor-pointer" onClick={onClick}>
            <div className="relative group items-center">
                <div className="m-1 absolute -inset-0.5 bg-gradient-to-r from-red-800 to-red-500 
    rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-tilt text-black"></div>
                <button
                    className="px-8 m-2 min-w-button btn bg-gradient-to-br from-red-800 to-red-500 hover:bg-white hover:text-black focus:bg-white focus:text-red-800 text-black text-3xl "
                    disabled={loading || disabled}
                >
                    {loading ? <Spinner /> : <span>{text}</span>}
                </button>
            </div>
        </div>
    );
};