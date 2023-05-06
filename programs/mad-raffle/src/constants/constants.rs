/// The public key of the native mint account on the Solana blockchain.
pub const NATIVE_MINT: &str = "So11111111111111111111111111111111111111112";

/// Fee Vault 
pub const FEE_VAULT: &str = "VLTJe32UcmbUpeKwsgp5734hWY6jhXnw7Nh7kvY72T6";

/// This is the authority to initiatialize stuff.
pub const AUTHORITY: &str = "TBD";

/// The current version of the Raffle account.
const _RENT_ADDITION: u64 = 1_120_560; // amount for + rent of 33 bytes

/// The current ticket price.
pub const TICKET_PRICE: u64 = 690_000_000; // 0.69 SOL in lamports

/// The current fee collected per ticket.
pub const TICKET_FEE: u64 = 6_942_069; // 0.0069 SOL in lamports

/// The current fee collected per ticket.
pub const PROGRAM_FEE: u64 = 6_942_069; // 0.0069 SOL in lamports

/// The maximum number of tickets that can be purchased per user.
pub const MAX_TICKETS_PER_USER: u8 = 255;