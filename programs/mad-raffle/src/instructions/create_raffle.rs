use anchor_lang::prelude::*;

use crate::state::{Raffle, RaffleTracker};
use crate::constants::{RAFFLE_SEED, RAFFLE_VERSION, TRACKER_SEED};


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
    tracker.current_raffle += 1;

    raffle.set_inner(Raffle {
        id: tracker.current_raffle,
        active: true,
        start_time: Clock::get().unwrap().unix_timestamp,
        tickets: Vec::new(),
        end_time: 0,
        version: RAFFLE_VERSION,
        bump: *ctx.bumps.get("raffle").unwrap()
    });

    Ok(())
}