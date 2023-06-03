import type { NextPage } from "next";
import Head from "next/head";
import { HomeView } from "../views";

const Home: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Mad Raffle</title>
        <meta
          name="Mad Raffle"
          content="Mad Raffle is a decentralized raffle platform built on Solana for the Mad Lads NFT community."
        />
      </Head>
      <HomeView />
    </div>
  );
};

export default Home;
