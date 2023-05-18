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
    use clockwork_sdk::state::ThreadResponse;

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

    pub fn create_thread(ctx: Context<CreateThread>, thread_id: Vec<u8>) -> Result<()> {
        instructions::create_thread(ctx, thread_id)
    }

    pub fn next_raffle(ctx: Context<NextRaffle>) -> Result<ThreadResponse> {
        instructions::next_raffle(ctx)
    }

    pub fn transfer_pnft<'a, 'b, 'c, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, TransferPNFT<'info>>,
        authorization_data: Option<AuthorizationDataLocal>,
        rules_acc_present: bool,
    ) -> Result<()> {
        instructions::transfer_pnft(ctx, authorization_data, rules_acc_present)
    }
    
}
