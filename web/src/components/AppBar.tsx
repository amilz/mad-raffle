import { FC, useRef } from 'react';
import Image, { StaticImageData } from 'next/image';
import React from "react";
import { useWallet } from '@solana/wallet-adapter-react';
import NavImage from './nav-element/image';
import HomeImageWhite from '../../public/icons/home-white.svg';
import HomeImageRed from '../../public/icons/home-red.svg';
import HistoryImageWhite from '../../public/icons/history-white.svg';
import HistoryImageRed from '../../public/icons/history-red.svg';
import TrophyImageWhite from '../../public/icons/trophy-white.svg';
import TrophyImageRed from '../../public/icons/trophy-red.svg';
import CloseImageRed from '../../public/icons/close-grey.svg';
import { useRouter } from 'next/router';

export const AppBar: FC = () => {
  const { disconnect, connected } = useWallet();
  const router = useRouter();
  const path = { router };
  const divRef = useRef<HTMLDivElement | null>(null);


  return (
<div className="flex justify-between items-center h-20 shadow-lg bg-black text-neutral-content border-b border-zinc-600 bg-opacity-66 p-4">
  {/* Left nav section (empty for now) */}
  <div className="w-1/4 md:w-1/6"></div>

  {/* Center nav section (Home/History) */}
  <div className="flex justify-center w-1/2 md:w-2/3 gap-6">
  {navItems.map((item, index) => (
    <NavImage
      key={index}
      imageSrc={item.imageSrc}
      activeSrc={item.activeSrc}
      label={item.label}
      href={item.href}
    />
  ))}

  </div>

  {/* Right nav section (WalletConnect) */}
  <div className="flex justify-end w-1/4 md:w-1/6">
    {connected && <Image src={CloseImageRed} className="mr-6" alt={'close'} onClick={disconnect} width={25} height={25}/>}
  </div>
</div>
  );
};


const navItems: NavItemProps[] = [
  {
    imageSrc: HomeImageWhite,
    activeSrc: HomeImageRed,
    label: 'Home Icon',
    href: '/',
  },
  {
    imageSrc: HistoryImageWhite,
    activeSrc: HistoryImageRed,
    label: 'History Icon',
    href: '/history',
  },
  {
    imageSrc: TrophyImageWhite,
    activeSrc: TrophyImageRed,
    label: 'Trophy Icon',
    href: '/points',
  },
];

interface NavItemProps {
  imageSrc: any;
  activeSrc: any;
  label: string;
  href: string;
}