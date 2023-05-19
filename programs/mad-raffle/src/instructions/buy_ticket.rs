use std::str::FromStr;

use anchor_lang::{prelude::*, system_program};
use solana_program::{system_instruction, pubkey::Pubkey};

use crate::model::RaffleError;
use crate::state::{Raffle, RaffleTracker};
use crate::constants::{RAFFLE_SEED, TICKET_PRICE, TICKET_FEE, TRACKER_SEED, FEE_VAULT, MAX_TICKETS_PER_USER, SUPER_RAFFLE_FEE, POINTS_PER_TICKET};

#[derive(Accounts)]
pub struct BuyTicket<'info> {
    #[account(
        mut, 
        seeds = [
            RAFFLE_SEED.as_ref(),
            &(tracker.current_raffle).to_le_bytes(),  
        ],
        bump = raffle.bump, 
        realloc = Raffle::get_space((raffle.tickets.len() + 1 ) as usize),
        realloc::payer = buyer,
        realloc::zero = false
    )]
    pub raffle: Account<'info, Raffle>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(
        mut, 
        address = Pubkey::from_str(FEE_VAULT).unwrap() @ RaffleError::InvalidVault
    )]
    pub fee_vault: SystemAccount<'info>,
    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,
    #[account(
        mut,
        seeds = [TRACKER_SEED.as_ref()],
        bump = tracker.bump,
        realloc = RaffleTracker::get_space((tracker.scoreboard.len() + 1 ) as usize),
        realloc::payer = buyer,
        realloc::zero = false
    )]
    pub tracker: Account<'info, RaffleTracker> 
}

pub fn buy_ticket(ctx: Context<BuyTicket>) -> Result<()> {
    let raffle = &mut ctx.accounts.raffle;
    let buyer = &ctx.accounts.buyer;
    let fee_vault = &ctx.accounts.fee_vault;
    let tracker = &mut ctx.accounts.tracker;
    // Verify raffle is active
    require!(raffle.active, RaffleError::NotActive);
/*     let current_time = Clock::get().unwrap().unix_timestamp;
    require!(current_time < raffle.end_time, RaffleError::RaffleClosed); */
    
    if let Some(ticket_holder) = raffle
        .tickets
        .iter()
        .find(|ticket_holder| ticket_holder.user == *buyer.key)
    {
        require!(
            ticket_holder.qty < MAX_TICKETS_PER_USER,
            RaffleError::MaxTicketsPerUserExceeded
        );
    }
    
    // Transfer funds to the Raffle Pool
    let transfer_instruction = system_instruction::transfer(
            buyer.key, 
            &raffle.to_account_info().key, 
            TICKET_PRICE
    );

    anchor_lang::solana_program::program::invoke_signed(
        &transfer_instruction,
        &[
            buyer.to_account_info(),
            raffle.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
        &[],
    )?;

    // Transfer funds to the Fee Vault
    let fee_transfer_instruction = system_instruction::transfer(
        buyer.key, 
        &fee_vault.to_account_info().key, 
        TICKET_FEE
    );

    anchor_lang::solana_program::program::invoke_signed(
        &fee_transfer_instruction,
        &[
            buyer.to_account_info(),
            fee_vault.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
        &[],
    )?;

    // Transfer funds to the Super Raffle
    let fee_transfer_instruction = system_instruction::transfer(
        buyer.key,
        &fee_vault.to_account_info().key, 
        SUPER_RAFFLE_FEE
    );

    anchor_lang::solana_program::program::invoke_signed(
        &fee_transfer_instruction,
        &[
            buyer.to_account_info(),
            //TODO replace with super raffle PDA
            fee_vault.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
        &[],
    )?;

    raffle.buy_ticket(&buyer.key);
    tracker.add_points(&buyer.key, POINTS_PER_TICKET);

    msg!("{} bought a raffle ticket to raffle# {}", buyer.key(), raffle.id);
    Ok(())
}
