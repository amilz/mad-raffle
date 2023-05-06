use anchor_lang::{prelude::*, system_program};

use crate::constants::TRACKER_SEED;
use crate::state::RaffleTracker;

#[derive(Accounts)]
pub struct InitializeTracker<'info> {
    // TODO add an authority lock
    #[account(init, payer = authority, space = 17, seeds = [TRACKER_SEED.as_ref()], bump)]
    pub tracker: Account<'info, RaffleTracker>,
    #[account(mut)]
    pub authority: Signer<'info>, // TODO Add constraint
    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,
}

pub fn initialize_tracker(ctx: Context<InitializeTracker>) -> Result<()> {
    let tracker = &mut ctx.accounts.tracker;
    tracker.set_inner(RaffleTracker {
        current_raffle: 0,
        bump: *ctx.bumps.get("tracker").unwrap(),
    });
    Ok(())
}
