import { Transaction, TransactionSignature } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import { Text, Image, View } from "react-native";
import { Button } from "react-xnft";
import tw from "twrnc";
import { Screen } from "../components/Screen";
import { ApiError, SolanaTxType } from "../madRaffle/error";
import { TxType, useMadRaffle } from "../madRaffle/useMadRaffle";
import { ErrorAnimation } from "../components/ErrorAnimation";
import { Loader } from "../components/Loader";
import { SuccessAnimation } from "../components/SuccessAnimation";

export function RaffleScreen() {
  const [loading, setLoading] = useState(false);
  const [userTickets, setUserTickets] = useState<number>(0);
  const [totalTickets, setTotalTickets] = useState<number>(0);
  const [showSuccess, setShowSuccess] = useState(false); // new state variable
  const [showError, setShowError] = useState(false); // new state variable

  const { madRaffle, connection, player, currentRaffle: raffleDetails, onComplete } = useMadRaffle();


  // Fetch the User's Tickets once the Raffle Details are fetched
  useEffect(() => {
    if (raffleDetails) {
      setTotalTickets(madRaffle.getTotalTickets(raffleDetails));
      if (player) {
        setUserTickets(madRaffle.getUserTickets(player, raffleDetails));
      }
      else { setUserTickets(0) }
    }
    else { setUserTickets(0) }
  }, [raffleDetails, player])

  // Buy a ticket
  const onBuyTicket = useCallback(async () => {
    if (loading) return;
    if (!madRaffle.isReady()) {
      console.log("Mad Raffle not ready!");
      return;
    }
    console.log('Ready!')
    try {
      setLoading(true);
      const transaction = new Transaction;
      const ix = await madRaffle.createBuyTicketInstruction();
      if (!ix) { ApiError.solanaTxError(SolanaTxType.FAILED_TO_GENERATE_IX) }
      let { lastValidBlockHeight, blockhash } = await connection.getLatestBlockhash('finalized');

      transaction.add(ix);
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = player;

      console.log("Sending transaction...")
      //@ts-ignore
      const signature: TransactionSignature = await window.xnft.solana.send(transaction);
      console.log("Transaction sent!")
      const results = await connection.confirmTransaction({ signature, lastValidBlockHeight, blockhash }, 'finalized');
      if (results.value.err) {
        ApiError.solanaTxError(SolanaTxType.FAILED_TO_CONFIRM);
      }
      onComplete(TxType.BuyTicket);
      setShowSuccess(true); // show the success animation
      setTimeout(() => {
        setShowSuccess(false);
        setLoading(false);
      }
        , 2000); // hide the success animation after 3 seconds

    } catch (err) {
      console.log(err);
      setShowError(true); // show the error animation
      setTimeout(() => {
        setShowError(false);
        setLoading(false);
      }, 2000); // hide the error animation after 3 seconds
    }

  }, [loading, madRaffle]);

  const ticketsString = totalTickets > 0 ? `You have ${userTickets} of ${totalTickets} tickets.` : 'No tickets sold yet.';

  return (
    <Screen
      style={tw`bg-black mt-10`}
    >
      <Image
        source={require("../../assets/mad.png")}
        style={{ width: 220, height: 220, alignSelf: 'center' }}
      />
      <br />
      {!loading ?
        /* If Not Loading, Show Main View */
        <View>
          <Text style={tw`px-4 font-bold text-white self-center text-xl`}>
            Buy a Focking Ticket
          </Text>
          <Text style={tw`px-4 font-bold text-white self-center text-xl`}>
            {ticketsString}
          </Text>
          <br />
          <Button
            onClick={onBuyTicket}
            style={tw` bg-[#E61A3E] h-12  max-w-lg	self-center  border-solid border-2 border-[#E61A3E] rounded `}
          >
            <Text style={tw`text-black font-bold text-lg`}>
              {"Buy a Ticket for 0.69 SOL"}
            </Text>
          </Button>
        </View>
        /* If Loading and Success, show Check */
        : showSuccess ? <SuccessAnimation />
        : showError ? <ErrorAnimation />
        /* If Loading and Not Success, show Loader */
        : <Loader displayText="Buying a Ticket..." />
      }
    </Screen>
  );
}
