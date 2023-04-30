use anchor_lang::prelude::*;

#[error_code]
pub enum RaffleError {
    #[msg("Selected raffle is not active")]
    NotActive,
}
