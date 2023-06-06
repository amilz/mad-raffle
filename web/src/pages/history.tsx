import type { NextPage } from "next";
import Head from "next/head";
import { HistoryView } from "../views";

const Basics: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Mad Raffle</title>
        <meta
          name="Mad Raffle Raffle History"
          content="Mad Raffle is a decentralized raffle platform built on Solana for the Mad Lads NFT community."
        />
      </Head>
      <HistoryView />
    </div>
  );
};

export default Basics;
