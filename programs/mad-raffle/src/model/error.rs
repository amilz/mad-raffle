use anchor_lang::prelude::*;

#[error_code]
pub enum RaffleError {
    #[msg("Selected raffle is not active")]
    NotActive,
    #[msg("Invalid vault account")]
    InvalidVault,
    #[msg("Raffle has already closed")]
    RaffleClosed,
    #[msg("Max tickets per user exceeded")]
    MaxTicketsPerUserExceeded,
}
