pub mod constants;
pub mod id;
pub mod instructions;
pub mod model;
pub mod state;
pub mod utils;

use anchor_lang::prelude::*;
use instructions::*;
use utils::AuthorizationDataLocal;
pub use id::ID;

#[program]
pub mod mad_raffle {

    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize(ctx)
    }

    pub fn buy_ticket(ctx: Context<BuyTicket>) -> Result<()> {
        instructions::buy_ticket(ctx)
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

    pub fn distribute_prize<'a, 'b, 'c, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, DistributePrize<'info>>,
        raffle_id: u64,
        authorization_data: Option<AuthorizationDataLocal>,
        rules_acc_present: bool,
    ) -> Result<()> {
        instructions::distribute_prize(ctx, raffle_id, authorization_data, rules_acc_present)
    }
    
}
