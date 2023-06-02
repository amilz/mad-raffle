import { FC } from 'react';

export const Footer: FC = () => {
    return (
        <footer className="border-t-2 border-zinc-600 bg-black hover:text-white fixed bottom-0 w-full flex items-center justify-center" >
            <div className="py-12 px-12">
                <div className="flex justify-center">
                    <div className="text-center text-xl tracking-wide font-normal ">
                        © 2023 MadRaffle.xyz
                    </div>
                </div>
            </div>
        </footer>
    );
};

