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

    pub fn transfer_pnft<'a, 'b, 'c, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, TransferPNFT<'info>>,
        authorization_data: Option<AuthorizationDataLocal>,
        rules_acc_present: bool,
    ) -> Result<()> {
        instructions::transfer_pnft(ctx, authorization_data, rules_acc_present)
    }
    
}
