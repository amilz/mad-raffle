import type { NextPage } from "next";
import Head from "next/head";
import { HistoryView } from "../views";

const Basics: NextPage = (props) => {
  return (
    <div>
      <Head>
      <title>Raffle unaffiliated with Mad Lads</title>
        <meta
          name="Raffle unaffiliated with Mad Lads"
          content="Raffle unaffiliated with Mad Lads is a decentralized raffle platform built on Solana for the Mad Lads NFT community."
        />
      </Head>
     {/*  <HistoryView /> */}
    </div>
  );
};

export default Basics;
