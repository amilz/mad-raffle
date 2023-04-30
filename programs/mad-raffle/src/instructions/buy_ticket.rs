use anchor_lang::prelude::*;
use solana_program::system_instruction;

use crate::model::RaffleError;
use crate::state::{Raffle, TicketHolder, RaffleTracker};
use crate::constants::{RAFFLE_SEED, TICKET_PRICE, TICKET_FEE, TRACKER_SEED};

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
    #[account(mut)] // TODO Add constraint
    pub fee_vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
    #[account(
        seeds = [TRACKER_SEED.as_ref()],
        bump = tracker.bump
    )]
    pub tracker: Account<'info, RaffleTracker> 
}

pub fn buy_ticket(ctx: Context<BuyTicket>) -> Result<()> {
    let raffle = &mut ctx.accounts.raffle;
    let buyer = &ctx.accounts.buyer;
    let fee_vault = &ctx.accounts.fee_vault;

    // Verify raffle is active
    require!(raffle.active, RaffleError::NotActive);

    // Transfer funds to the Raffle Pool
    let transfer_instruction = system_instruction::transfer(
            buyer.key, 
            &raffle.to_account_info().key, 
            TICKET_PRICE - TICKET_FEE
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

        // Transfer funds to the Raffle Pool
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

    // Update ticket count or add a new TicketHolder
    match raffle
        .tickets
        .iter_mut()
        .find(|ticket_holder| ticket_holder.user == *buyer.key)
    {
        Some(ticket_holder) => ticket_holder.qty += 1,
        None => raffle.tickets.push(TicketHolder {
            user: *buyer.key,
            qty: 1,
        }),
    }

    Ok(())
}
