import { ComputeBudgetProgram, LAMPORTS_PER_SOL, Transaction, TransactionSignature } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import { Text, Image, } from "react-native";
import { Button, View } from "react-xnft";
import tw from "twrnc";
import { Screen } from "../components/Screen";
import { ApiError, SolanaTxType } from "../madRaffle/error";
import { SimpleNFT } from "../madRaffle/sdk";
import { TxType, useMadRaffle } from "../madRaffle/useMadRaffle";
import { formatNumber } from "../utils";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { withAnimations, WithAnimationsProps } from "../components/withAnimations";

function SellScreen({
  showSuccessAnimation,
  showErrorAnimation,
  showLoadingAnimation
}: WithAnimationsProps) {
  const [selectedNft, setSelectedNft] = useState<SimpleNFT | null>();
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3;


  const { madRaffle, connection, player, currentRaffle: raffleDetails, playerNfts, onComplete } = useMadRaffle();


  // Sell a Lad
  const onSellLad = useCallback(async () => {
    if (!selectedNft) return;
    if (!madRaffle.isReady()) {
      console.log("Mad Raffle not ready!");
      return;
    }
    try {
      showLoadingAnimation();
      const transaction = new Transaction;
      console.log("THERES A MINT", selectedNft.mint)
      const ix = await madRaffle.createEndRaffleInstruction(selectedNft.mint!); // assuming sellNft method exists
      if (!ix) { ApiError.solanaTxError(SolanaTxType.FAILED_TO_GENERATE_IX) }
      let { lastValidBlockHeight, blockhash } = await connection.getLatestBlockhash('finalized');

      transaction.add(ix);
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = player;
      transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 1000000 }))


      //@ts-ignore
      await window.xnft.solana.sendAndConfirm(transaction, null, { commitment: 'finalized' });
      /*       const results = await connection.confirmTransaction({ signature, lastValidBlockHeight, blockhash }, 'confirmed');
      if (results.value.err) {
        ApiError.solanaTxError(SolanaTxType.FAILED_TO_CONFIRM);
      } */
      onComplete(TxType.SellNFT);
      showSuccessAnimation(); // show the success animation

    } catch (err) {
      console.log(err);
      showErrorAnimation(); // show the error animation
    }

  }, [madRaffle, selectedNft, player, connection, onComplete
  ]);


  const onNftClick = useCallback((nft: SimpleNFT) => {
    if (selectedNft === nft) {
      setSelectedNft(null);
      return;
    }
    setSelectedNft(nft);
  }, [
    selectedNft, setSelectedNft
  ]);

  const totalPages = Math.ceil(playerNfts.length / itemsPerPage);

  const handleNext = () => {
    if (currentPage === totalPages - 1) return;
    setCurrentPage((prevPage) => prevPage + 1);
  };

  const handlePrev = () => {
    if (currentPage === 0) return;
    setCurrentPage((prevPage) => prevPage - 1);
  };
  const solPriceString = raffleDetails ? (formatNumber(raffleDetails.availableLamports / LAMPORTS_PER_SOL)).toString() : '0';

  return (
    <Screen style={tw`bg-black`} >
      <Text style={tw`px-4 font-bold text-white self-center text-xl`}>
        Select a Lad to sell for {solPriceString} SOL
      </Text>
      <br />
      {selectedNft ?
        <Button
          onClick={onSellLad}
          style={tw` bg-[#E61A3E] h-12  max-w-lg	self-center  border-solid border-2 border-[#E61A3E] rounded `}
        >
          <Text style={tw`text-black font-bold text-lg`}>
            {`Sell a Lad for ${solPriceString} SOL`}
          </Text>
        </Button> : <></>
      }

      {/* TODO(amilz) center this */}
      <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, maxWidth: 900, marginLeft: '1%' }}>
        {playerNfts.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage).map((nft) => {
          const selected = selectedNft === nft;
          return (<View style={{ backgroundColor: selected ? '#E61A3E' : 'black', width: '32%', padding: 2, borderRadius: 5 }}>
            <Button
              key={nft.name}
              onClick={() => onNftClick(nft)}
              style={{
                borderWidth: 2,
                borderColor: selected ? '#E61A3E' : 'slategray',
                borderRadius: 6,
                padding: 0,
                position: 'relative',
                overflow: 'hidden', // to ensure the child image is also rounded
                width: '98%', // or any other value depending on how many items per row you want
                aspectRatio: 1, // to ensure the item is square
                justifyContent: 'center', // center the image vertically
                alignItems: 'center', // center the image horizontally
                margin: '1%'

              }}
            >

              <Image
                source={nft.image as any}
                style={{
                  width: '100%',
                  height: '100%',
                  justifyContent: 'center', // center the image vertically
                  alignItems: 'center', // center the image horizontally
                  resizeMode: 'cover', // this is similar to object-fit: cover in CSS
                }}
              />

            </Button><br />
            <View style={{ width: '100%' }}>
              <Text
                style={{
                  width: '100%',
                  textAlign: 'center',
                  fontSize: 20,
                  alignSelf: 'center',
                  backgroundColor: selected ? '#E61A3E' : 'black',
                  color: selected ? 'black' : 'white',
                  fontWeight: selected ? 'bold' : 'normal',
                  alignItems: 'center',
                }}
              >
                {nft.name?.slice(nft.name.length - 5)}
              </Text>
            </View></View>
          );
        })}
        {playerNfts.length > 3 && <View style={{ margin: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          {/* Prev Page Button */}
          {currentPage === 0 ? <></> : <Button
            style={{ background: 'none', border: 'none' }}
            onClick={handlePrev}
          ><MaterialCommunityIcons name="chevron-left" color={'#E61A3E'} size={40} /></Button>}
          {/* Next Page Button */}
          {currentPage === totalPages - 1 ? <></> : <Button
            style={{ background: 'none', border: 'none' }}
            onClick={handleNext}
          ><MaterialCommunityIcons name="chevron-right" color={'#E61A3E'} size={40} />
          </Button>}
        </View>}
      </View>

    </Screen>
  );
}

export const SellLadScreen = withAnimations(SellScreen, "Selling your Lad...");
