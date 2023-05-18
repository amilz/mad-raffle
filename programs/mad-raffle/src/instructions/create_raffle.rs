use anchor_lang::{prelude::*, system_program};

use crate::state::{Raffle, RaffleTracker};
use crate::constants::{RAFFLE_SEED, TRACKER_SEED};


#[derive(Accounts)]
pub struct CreateRaffle<'info> {
    #[account(
        init, 
        payer = user, 
        space = Raffle::get_space(0),
        seeds = [
            RAFFLE_SEED.as_ref(),
            &(tracker.current_raffle + 1).to_le_bytes(), // +1 because we are creating a new raffle & will increment the tracker in the instruction
        ],
        bump
    )]
    pub raffle: Account<'info, Raffle>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,
    #[account(
        mut,
        seeds = [TRACKER_SEED.as_ref()],
        bump = tracker.bump
    )]
    pub tracker: Account<'info, RaffleTracker>
}

pub fn create_raffle(ctx: Context<CreateRaffle>) -> Result<()> {
    let raffle = &mut ctx.accounts.raffle;
    let tracker: &mut Account<RaffleTracker> = &mut ctx.accounts.tracker;
    tracker.increment();

    raffle.initialize(
        tracker.current_raffle,
        *ctx.bumps.get("raffle").unwrap(),
    );

    Ok(())
}