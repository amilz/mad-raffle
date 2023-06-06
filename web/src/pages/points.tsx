import type { NextPage } from "next";
import Head from "next/head";
import { ScoreboardView } from "../views";

const Basics: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Mad Raffle</title>
        <meta
          name="Mad Raffle Points"
          content="Mad Raffle is a decentralized raffle platform built on Solana for the Mad Lads NFT community."
        />
      </Head>
      <ScoreboardView />
    </div>
  );
};

export default Basics;
