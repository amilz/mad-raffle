use anchor_lang::prelude::*;

#[account]
pub struct RaffleTracker {
    pub current_raffle: u64,
    pub bump: u8,
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
        1 + // version
        8 + // bump
        8 + // id
        1 + // active
        4 + // vec minimium 
        (TicketHolder::get_space() * (ticket_holder_count)) + // tickets
        8 + // start time
        8 // end time
    }
}

impl TicketHolder {
    pub fn get_space() -> usize {
        32 + // user (Pubkey)
        1 // qty (u8)
    }
}