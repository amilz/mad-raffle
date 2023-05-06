use anchor_lang::{prelude::*, system_program};

use crate::model::RaffleError;
use crate::state::{Raffle, RaffleTracker};
use crate::constants::{RAFFLE_SEED, TRACKER_SEED};


#[derive(Accounts)]
pub struct EndRaffle<'info> {
    #[account(
        mut, 
        seeds = [
            RAFFLE_SEED.as_ref(),
            &(tracker.current_raffle).to_le_bytes(),  
        ],
        bump = raffle.bump
    )]
    pub raffle: Account<'info, Raffle>,
    #[account(mut)]
    pub seller: Signer<'info>,
    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,
    #[account(
        mut,
        seeds = [TRACKER_SEED.as_ref()],
        bump = tracker.bump
    )]
    pub tracker: Account<'info, RaffleTracker>
}

pub fn end_raffle(ctx: Context<EndRaffle>) -> Result<()> {
    let raffle = &mut ctx.accounts.raffle;
    let seller = &mut ctx.accounts.seller;
    let tracker = &mut ctx.accounts.tracker;
    // Verify raffle is active
    require!(raffle.active, RaffleError::NotActive);

    // Calculate payment amount and royalty amount
    // Leave enough lamports in the account to cover rent
    let rent_required = Rent::get()?.minimum_balance(Raffle::get_space(raffle.tickets.len() as usize));
    let available_balance_lamports: u64 = raffle.to_account_info().lamports();
    let available_balance: u64 = available_balance_lamports.saturating_sub(rent_required);
    let royalties_rate: u64 = 5; // 5% royalty rate, TODO fetch from metadata
    let total_rate: u64 = 100 + royalties_rate;

    let payment_to_seller: u64 = (available_balance / total_rate) * 100;
    let _royalties_payment: u64 = available_balance - payment_to_seller;

    **raffle
    .to_account_info()
    .try_borrow_mut_lamports()? -= payment_to_seller;
    **seller
    .to_account_info()
    .try_borrow_mut_lamports()? += payment_to_seller;


    //TODO transfer pNFT to program
    //TODO pay royalties

    raffle.end_raffle();
    tracker.increment();
    msg!("New raffle to be created: {}", tracker.current_raffle);
    Ok(())
}