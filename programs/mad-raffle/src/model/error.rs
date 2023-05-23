use anchor_lang::prelude::*;

#[error_code]
pub enum RaffleError {
    #[msg("Selected raffle is not active")]
    NotActive,
    #[msg("Selected raffle is still active")]
    StillActive,
    #[msg("Invalid vault account")]
    InvalidVault,
    #[msg("Raffle has already closed")]
    RaffleClosed,
    #[msg("Max tickets per user exceeded")]
    MaxTicketsPerUserExceeded,
    #[msg("Raffle is already active")]
    RaffleAlreadyActive,
    #[msg("No Raffle Tickets Sold")]
    NoTickets,
    #[msg("Error Selecting Winner")]
    NoWinner,
    #[msg("UNAUTHORIZED")]
    UnauthorizedSigner,
    #[msg("Winner already selected")]
    WinnerAlreadySelected,
}

#[error_code]
pub enum PnftError {
    #[msg("Bad Metadata")]
    BadMetadata,
    #[msg("Bad Ruleset")]
    BadRuleset,
    #[msg("Invalid Collection")]
    InvalidCollectionAddress,
    #[msg("Not Verified by the Collection")]
    NotVerifiedByCollection,
}