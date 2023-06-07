use std::str::FromStr;

use anchor_lang::{prelude::*, system_program};
use pyth_sdk_solana::{load_price_feed_from_account_info};

use crate::model::{RaffleError, FeedError};
use crate::state::{Raffle};
use crate::constants::{RAFFLE_SEED, AUTHORITY, SOL_PRICE_FEED, STALENESS_THRESHOLD};

#[derive(Accounts)]
#[instruction(raffle_id: u64)]
pub struct PickWinner<'info> {
    #[account(
        mut, 
        seeds = [
            RAFFLE_SEED.as_ref(),
            &(raffle_id).to_le_bytes(),  
        ],
        constraint = raffle.id == raffle_id,
        bump = raffle.bump
    )]
    pub raffle: Account<'info, Raffle>,
    #[account(
        mut,
        address = Pubkey::from_str(AUTHORITY).unwrap() @ RaffleError::UnauthorizedSigner
    )]
    pub authority: Signer<'info>,

    /// Unchecked random address using Keypair.generate().pubkey()
    pub random: SystemAccount<'info>,

    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,

    /// CHECK: using address constraint1
    #[account(address = Pubkey::from_str(SOL_PRICE_FEED).unwrap() @ FeedError::InvalidPriceFeed)]
    pub price_feed: AccountInfo<'info>,
}

pub fn pick_winner(ctx: Context<PickWinner>) -> Result<()> {
    let raffle = &mut ctx.accounts.raffle;
    let random = &ctx.accounts.random;
    let total_tickets: u32 = raffle.get_ticket_count();
    require!(!raffle.active, RaffleError::StillActive);
    require!(raffle.winner.is_none(), RaffleError::WinnerAlreadySelected);
    require!(total_tickets > 0, RaffleError::NoTickets);

    let price_account_info = &ctx.accounts.price_feed;
    let current_timestamp = Clock::get()?.unix_timestamp;
    let price_feed = load_price_feed_from_account_info( &price_account_info ).unwrap();
    let current_price = price_feed.get_price_no_older_than(current_timestamp, STALENESS_THRESHOLD).unwrap();
    raffle.pick_winner(random.key(), current_price.price);
    Ok(())
}