/// The public key of the native mint account on the Solana blockchain.
pub const NATIVE_MINT: &str = "So11111111111111111111111111111111111111112";

/// Fee Vault 
pub const FEE_VAULT: &str = "68zZq8P3An1z98askGjUeUPijnaHpvnYcZNVeiM2pTrz";

/// This is the authority to initiatialize stuff.
pub const AUTHORITY: &str = "AUTHtStYmZz7G8KQz6R6FmussLgPrybNhHx4EZzQwFBF";
// (DEV: AuthtWB95Cf3KaHh2gTsQLfKNtsGMgFg9BxgqbHjeLVy)

/// The current version of the Raffle account.
const _RENT_ADDITION: u64 = 1_120_560; // amount for + rent of 33 bytes

/// The current ticket price.
pub const TICKET_PRICE: u64 = 670_000_000; // 0.67 SOL in lamports

/// The current fee collected per ticket.
pub const TICKET_FEE: u64 = 13_100_000; // 0.0131 SOL in lamports

/// The current fee collected per ticket.
pub const SUPER_RAFFLE_FEE: u64 = 6_900_000; // 0.0069 SOL in lamports

/// The  cost per new raffle (rounded up)
pub const NEW_RAFFLE_COST: u64 = 1_500_000;

/// The maximum number of tickets that can be purchased per user.
pub const MAX_TICKETS_PER_USER: u8 = 50;

/// The number of points per ticket.
pub const POINTS_PER_TICKET: u32 = 1;

/// The number of points for selling.
pub const POINTS_FOR_SELLING: u32 = 10;

/// Collection Address
pub const COLLECTION_ADDRESS: &str = "J1S9H3QjnRtBbbuD4HjPV6RpRhwuk4zKbxsnCHuTgh9w";
// pub const COLLECTION_ADDRESS: &str = "CLxN2mQsewGLsTKw3gML1AWFQjrWpG6WgLYTLX9BdhRp"(dev) "J1S9H3QjnRtBbbuD4HjPV6RpRhwuk4zKbxsnCHuTgh9w"(prod);

/// Price Feeds
pub const SOL_PRICE_FEED: &str = "H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG";
pub const STALENESS_THRESHOLD: u64 = 1; // staleness threshold in seconds