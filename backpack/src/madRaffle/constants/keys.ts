import { PublicKey } from "@solana/web3.js";
import { config, CONFIG } from "./config";

interface Keys {
    collection: string;
    auth: string;
    vault: string;
    price: string;
}

const DEV_KEYS: Keys = {
    collection: 'CLxN2mQsewGLsTKw3gML1AWFQjrWpG6WgLYTLX9BdhRp',
    auth: 'AuthtWB95Cf3KaHh2gTsQLfKNtsGMgFg9BxgqbHjeLVy',
    vault: 'VLTJe32UcmbUpeKwsgp5734hWY6jhXnw7Nh7kvY72T6',
    price: 'J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix'
}

const PROD_KEYS: Keys = {
    collection: 'J1S9H3QjnRtBbbuD4HjPV6RpRhwuk4zKbxsnCHuTgh9w',
    auth: 'AUTHtStYmZz7G8KQz6R6FmussLgPrybNhHx4EZzQwFBF',
    vault: '68zZq8P3An1z98askGjUeUPijnaHpvnYcZNVeiM2pTrz',
    price: 'H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG'
}

let keys: Keys;

switch (config) {
    case CONFIG.DEV:
        keys = DEV_KEYS;
        break;
    case CONFIG.PROD:
        keys = PROD_KEYS;
        break;
    default:
        throw new Error('Invalid CONFIG value');
}

export const COLLECTION_PUBKEY = new PublicKey(keys.collection);
export const AUTH_PUBKEY = new PublicKey(keys.auth);
export const VAULT_PUBKEY = new PublicKey(keys.vault);
export const PRICE_FEED = new PublicKey(keys.price);


export const METAPLEX_DEFAULT_RULES = new PublicKey('eBJLFYPxJmMGKuFwpDWkzxZeUrad92kZRC5BJLpzyT9');

export const TOKEN_METADATA_PROGRAM = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

export const AUTH_PROGRAM_ID = new PublicKey("auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg");