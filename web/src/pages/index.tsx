import type { NextPage } from "next";
import Head from "next/head";
import { HomeView } from "../views";

const Home: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Raffle unaffiliated with Mad Lads</title>
        <meta
          name="Raffle unaffiliated with Mad Lads"
          content="Raffle unaffiliated with Mad Lads is a decentralized raffle platform built on Solana for the Mad Lads NFT community."
        />
      </Head>
      <div className="hero-content flex flex-col">please visit 
        <a href="https://www.xnft.gg/app/H7kTonAqFquvzd77hwoC4H2R3U3ogPwccsxhnvFwMd52">our xnft for more info</a>

      </div>
      {/* <HomeView /> */}
    </div>
  );
};

export default Home;
