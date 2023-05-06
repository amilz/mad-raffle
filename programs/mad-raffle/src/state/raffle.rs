use anchor_lang::prelude::*;
use crate::{id::ID, constants::RAFFLE_SEED};

#[account]
pub struct RaffleTracker {
    pub current_raffle: u64,
    pub bump: u8,
}

use solana_program::pubkey::Pubkey;

impl RaffleTracker {
    pub fn next_raffle_pda(&self) -> (Pubkey, u8) {
        let (next_raffle_pda, next_raffle_bump) = Pubkey::find_program_address(
            &[
                RAFFLE_SEED.as_ref(),
                &(self.current_raffle + 1 as u64).to_le_bytes(),
            ],
            &ID,
        );
        (next_raffle_pda, next_raffle_bump)
    }
    pub fn increment(&mut self) {
        self.current_raffle += 1;
    }
}

#[account]
pub struct Raffle {
    pub id: u64,
    pub version: u8,
    pub bump: u8,
    pub active: bool,
    pub tickets: Vec<TicketHolder>,
    pub start_time: i64,
    pub end_time: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct TicketHolder {
    pub user: Pubkey,
    pub qty: u8,
}

impl Raffle {
    pub fn get_space(ticket_holder_count: usize) -> usize {
        8 + // discriminator
        8 + // id
        1 + // version
        1 + // bump
        1 + // active
        4 + // vec minimium 
        (TicketHolder::get_space() * (ticket_holder_count)) + // tickets
        8 + // start time
        8 // end time
    }
    pub fn end_raffle(&mut self) {
        self.active = false;
        self.end_time = Clock::get().unwrap().unix_timestamp;
    }
}

impl TicketHolder {
    pub fn get_space() -> usize {
        32 + // user (Pubkey)
        1 // qty (u8)
    }
}