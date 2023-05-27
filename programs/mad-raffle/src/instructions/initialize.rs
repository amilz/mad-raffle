use std::str::FromStr;

use anchor_lang::{prelude::*, system_program};

use crate::constants::{TRACKER_SEED, SUPER_RAFFLE_SEED, AUTHORITY, RAFFLE_SEED};
use crate::model::RaffleError;
use crate::state::{RaffleTracker, SuperVault, Raffle};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init, 
        payer = authority, 
        space = RaffleTracker::get_space(0), 
        seeds = [TRACKER_SEED.as_ref()], 
        bump
    )]
    pub tracker: Account<'info, RaffleTracker>,
    #[account(
        init, 
        payer = authority, 
        space = SuperVault::get_space(), 
        seeds = [SUPER_RAFFLE_SEED.as_ref()], 
        bump
    )]
    pub super_vault: Account<'info, SuperVault>,
    #[account(
        init, 
        payer = authority, 
        space = Raffle::get_space(0),
        seeds = [
            RAFFLE_SEED.as_ref(),
            // 1 because we are creating the 1st raffle only
            &(1 as u64).to_le_bytes(), 
        ],
        bump
    )]
    pub raffle: Account<'info, Raffle>,
    #[account(
        mut,
        address = Pubkey::from_str(AUTHORITY).unwrap() @ RaffleError::UnauthorizedSigner
    )]
    pub authority: Signer<'info>,
    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>
}

pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let tracker = &mut ctx.accounts.tracker;
    let super_vault = &mut ctx.accounts.super_vault;
    let raffle: &mut Account<Raffle> = &mut ctx.accounts.raffle;

    // Initialize Supervault
    super_vault.bump = *ctx.bumps.get("super_vault").unwrap();
    // Initialize RaffleTracker
    tracker.set_inner(RaffleTracker {
        current_raffle: 1,
        bump: *ctx.bumps.get("tracker").unwrap(),
        scoreboard: Vec::new()
    });
    // Initialize Raffle #1
    raffle.initialize(
        tracker.current_raffle,
        *ctx.bumps.get("raffle").unwrap(),
    );
    Ok(())
}
