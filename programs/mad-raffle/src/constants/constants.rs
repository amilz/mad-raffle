/// The public key of the native mint account on the Solana blockchain.
pub const NATIVE_MINT: &str = "So11111111111111111111111111111111111111112";

/// Fee Vault 
pub const FEE_VAULT: &str = "VLTJe32UcmbUpeKwsgp5734hWY6jhXnw7Nh7kvY72T6";

/// Thread
pub const THREAD_ADDRESS: &str = "CTYHvECD7HcjzjkcwsdVDhesTLHwjSNnGm913vCLc7U1";

/// This is the authority to initiatialize stuff.
pub const AUTHORITY: &str = "TBD";

/// The current version of the Raffle account.
const _RENT_ADDITION: u64 = 1_120_560; // amount for + rent of 33 bytes

/// The current ticket price.
pub const TICKET_PRICE: u64 = 660_000_000; // 0.66 SOL in lamports

/// The current fee collected per ticket.
pub const TICKET_FEE: u64 = 20_000_000; // 0.02 SOL in lamports

/// The current fee collected per ticket.
pub const SUPER_RAFFLE_FEE: u64 = 10_000_000; // 0.01 SOL in lamports

/// The threadwork fee per execution.
pub const CLOCKWORK_FEE: u64 = 1_000; // 0.000001 SOL in lamports

/// The thread's cost per new raffle (inclusive of Clockwork fee & rounded up)
pub const NEW_RAFFLE_COST: u64 = 1_500_000;

/// The maximum number of tickets that can be purchased per user.
pub const MAX_TICKETS_PER_USER: u8 = 255;

/// Collection Address
pub const COLLECTION_ADDRESS: &str = "CLxN2mQsewGLsTKw3gML1AWFQjrWpG6WgLYTLX9BdhRp";
// TODO FOR PROD
// pub const COLLECTION_ADDRESS: &str = "J1S9H3QjnRtBbbuD4HjPV6RpRhwuk4zKbxsnCHuTgh9w";