/// The public key of the native mint account on the Solana blockchain.
pub const NATIVE_MINT: &str = "So11111111111111111111111111111111111111112";

/// This is the authority to initiatialize stuff.
pub const AUTHORITY: &str = "TBD";

/// The current version of the Raffle account.
const _RENT_ADDITION: u64 = 1_120_560; // amount for + rent of 33 bytes

/// The current ticket price.
pub const TICKET_PRICE: u64 = 100_000_000; // 0.1 SOL in lamports

/// The current fee collected per ticket.
pub const TICKET_FEE: u64 = 1_000_000; // 0.001 SOL in lamports

/// Raffle Version
pub const RAFFLE_VERSION: u8 = 1;

/// Program FEE
pub const PROGRAM_FEE: f64 = 0.01;