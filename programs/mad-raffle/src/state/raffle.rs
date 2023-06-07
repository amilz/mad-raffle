use anchor_lang::prelude::*;
use solana_program::{pubkey::Pubkey};
use crate::utils::{select_winner, pick_winner};

#[account]
pub struct Raffle {
    pub id: u64,
    pub version: u8,
    pub bump: u8,
    pub active: bool,
    pub tickets: Vec<TicketHolder>,
    pub start_time: i64,
    pub end_time: i64,
    pub prize: Option<Prize>,
    pub winner: Option<Pubkey>
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct Prize {
    pub mint: Pubkey,
    pub ata: Pubkey,
    pub sent: bool
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct TicketHolder {
    pub user: Pubkey,
    pub qty: u8,
}

impl Raffle {
    const RAFFLE_VERSION:u8 = 1;
    pub fn get_space(ticket_holder_count: usize) -> usize {
        8 + // discriminator
        8 + // id
        1 + // version
        1 + // bump
        1 + // active
        4 + // vec minimium 
        (TicketHolder::get_space() * (ticket_holder_count)) + // tickets
        8 + // start time
        8 + // end time
        1 + // option
        (Prize::get_space()) + // prize
        1 + // option
        32  // winner
    }
    pub fn initialize(&mut self, raffle_id: u64, bump: u8) {
        self.id = raffle_id;
        self.active = true;
        self.start_time = Clock::get().unwrap().unix_timestamp;
        self.tickets = Vec::new();
        self.end_time = 0;
        self.version = Raffle::RAFFLE_VERSION;
        self.bump = bump;
    }
    pub fn end_raffle(&mut self, mint: Pubkey, ata: Pubkey) {
        self.active = false;
        self.end_time = Clock::get().unwrap().unix_timestamp;
        self.prize = Some(Prize {
            mint,
            ata,
            sent:false
        });
    }
    pub fn buy_ticket(&mut self, buyer: &Pubkey) {
        match self
            .tickets
            .iter_mut()
            .find(|ticket_holder| ticket_holder.user == *buyer)
        {
            Some(ticket_holder) => ticket_holder.qty += 1,
            None => self.tickets.push(TicketHolder {
                user: *buyer,
                qty: 1,
            }),
        }
    }
    pub fn select_winner(&mut self, random: Pubkey) {
        match select_winner(self, random) {
            Ok(winner) => {
                self.winner = Some(winner);
                msg!("The winner is {:?}", self.winner);
            }
            Err(e) => {
                msg!("Error selecting winner: {:?}", e);
            }
        }
    }
    pub fn pick_winner(&mut self, random: Pubkey, randomness: i64) {
        match pick_winner(self, random, randomness) {
            Ok(winner) => {
                self.winner = Some(winner);
                msg!("The winner is {:?}", self.winner);
            }
            Err(e) => {
                msg!("Error selecting winner: {:?}", e);
            }
        }
    }
    pub fn get_ticket_count(&self) -> u32 {
        self.tickets.iter().map(|holder| holder.qty as u32).sum()
    }
    
}

impl TicketHolder {
    pub fn get_space() -> usize {
        32 + // user (Pubkey)
        1 // qty (u8)
    }
}

impl Prize {
    pub fn get_space() -> usize {
        32 + // mint (Pubkey)
        32 + // ata (Pubkey)
        1    // sent (bool)
    }
}