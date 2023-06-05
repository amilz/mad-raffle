import { FC } from 'react';
import dynamic from 'next/dynamic';
import React, { useState } from "react";
import { useAutoConnect } from '../contexts/AutoConnectProvider';
import NetworkSwitcher from './NetworkSwitcher';
import NavElement from './nav-element';

const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export const AppBar: FC = () => {
  const { autoConnect, setAutoConnect } = useAutoConnect();
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <div className="flex justify-between items-center h-20 shadow-lg bg-black text-neutral-content border-b border-zinc-600 bg-opacity-66 p-4">
      {/* Left nav section (Home/History) */}
      <div className="flex gap-6">
        <NavElement
          label="🏠"
          href="/"
          navigationStarts={() => setIsNavOpen(false)}
        />
        <NavElement
          label="🕘"
          href="/history"
          navigationStarts={() => setIsNavOpen(false)}
        />
      </div>

      {/* Right nav section (WalletConnect) */}
      <div>
        <WalletMultiButtonDynamic className="btn-ghost btn-sm rounded-btn text-lg" />
      </div>
    </div>
  );
};
