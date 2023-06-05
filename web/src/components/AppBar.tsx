import { FC } from 'react';
import dynamic from 'next/dynamic';
import React, { useState } from "react";
import { useAutoConnect } from '../contexts/AutoConnectProvider';
import NavElement from './nav-element';
import { useWallet } from '@solana/wallet-adapter-react';


export const AppBar: FC = () => {
  const { autoConnect, setAutoConnect } = useAutoConnect();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { disconnect, connected } = useWallet();

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
        {connected && <button onClick={disconnect}> ❌ </button>}
      </div>
    </div>
  );
};
