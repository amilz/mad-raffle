use std::str::FromStr;

use anchor_lang::{prelude::*, system_program};

use crate::model::RaffleError;
use crate::state::{Raffle};
use crate::constants::{RAFFLE_SEED, AUTHORITY};


#[derive(Accounts)]
#[instruction(raffle_id: u64)]
pub struct SelectWinner<'info> {
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
    pub system_program: Program<'info, System>
}

pub fn select_winner(ctx: Context<SelectWinner>) -> Result<()> {
    let raffle = &mut ctx.accounts.raffle;
    let random = &ctx.accounts.random;
    let total_tickets: u32 = raffle.tickets.iter().map(|holder| holder.qty as u32).sum();

    require!(!raffle.active, RaffleError::StillActive);
    require!(raffle.winner.is_none(), RaffleError::WinnerAlreadySelected);
    require!(total_tickets > 0, RaffleError::NoTickets);

    raffle.select_winner(random.key());
    Ok(())
}