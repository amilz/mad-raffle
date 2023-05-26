use std::str::FromStr;

use anchor_lang::{prelude::*, system_program};

use crate::constants::{TRACKER_SEED, SUPER_RAFFLE_SEED, AUTHORITY};
use crate::model::RaffleError;
use crate::state::{RaffleTracker, SuperVault};

#[derive(Accounts)]
pub struct InitializeTracker<'info> {
    #[account(
        init, 
        payer = authority, 
        space = RaffleTracker::get_space(0), 
        seeds = [TRACKER_SEED.as_ref()], 
        bump
    )]
    pub tracker: Account<'info, RaffleTracker>,
    #[account(
        mut,
        address = Pubkey::from_str(AUTHORITY).unwrap() @ RaffleError::UnauthorizedSigner
    )]
    pub authority: Signer<'info>,
    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,
    #[account(
        init, 
        payer = authority, 
        space = SuperVault::get_space(), 
        seeds = [SUPER_RAFFLE_SEED.as_ref()], 
        bump
    )]
    pub super_vault: Account<'info, SuperVault>,
}

pub fn initialize_tracker(ctx: Context<InitializeTracker>) -> Result<()> {
    let tracker = &mut ctx.accounts.tracker;
    let super_vault = &mut ctx.accounts.super_vault;
    super_vault.bump = *ctx.bumps.get("super_vault").unwrap();
    tracker.set_inner(RaffleTracker {
        current_raffle: 0,
        bump: *ctx.bumps.get("tracker").unwrap(),
        scoreboard: Vec::new()
    });
    Ok(())
}
