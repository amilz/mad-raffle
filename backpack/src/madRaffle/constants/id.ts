import { PublicKey } from "@solana/web3.js";
import { config, CONFIG } from "./config";


const ID_DEV = "GDBJ3Gfvzd1dzBKq5UryHAodUF8k5ZwjvinV6dferSm1";
const ID_PROD = "MAD67ypEX8PR92g45gP8jtRhg8NNQhdAd4yLkh2BKmD";

let ID: string;

switch (config) {
    case CONFIG.DEV:
        ID = ID_DEV;
        break;
    case CONFIG.PROD:
        ID = ID_PROD;
        break;
    default:
        throw new Error('Invalid CONFIG value');
}

export const MAD_RAFFLE_PROGRAM_ID = new PublicKey(ID);