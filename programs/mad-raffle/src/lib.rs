pub mod constants;
pub mod id;
pub mod instructions;
pub mod model;
pub mod state;
pub mod utils;

use anchor_lang::prelude::*;
use instructions::*;

pub use id::ID;

#[program]
pub mod mad_raffle {

    use super::*;
    pub fn create_raffle(ctx: Context<CreateRaffle>) -> Result<()> {
        instructions::create_raffle(ctx)
    }

    pub fn buy_ticket(ctx: Context<BuyTicket>) -> Result<()> {
        instructions::buy_ticket(ctx)
    }

    pub fn initialize_tracker(ctx: Context<InitializeTracker>) -> Result<()> {
        instructions::initialize_tracker(ctx)
    }

    pub fn end_raffle<'a, 'b, 'c, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, EndRaffle<'info>>,
        authorization_data: Option<AuthorizationDataLocal>,
        rules_acc_present: bool,
    ) -> Result<()> {
        instructions::end_raffle(ctx, authorization_data, rules_acc_present)
    }

    pub fn select_winner(ctx: Context<SelectWinner>, _raffle_id: u64) -> Result<()> {
        instructions::select_winner(ctx)
    }
    
}
