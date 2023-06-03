import type { NextPage } from "next";
import Head from "next/head";
import { HistoryView } from "../views";

const Basics: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Mad Raffle</title>
        <meta
          name="description"
          content="Basic Functionality"
        />
      </Head>
      <HistoryView />
    </div>
  );
};

export default Basics;
