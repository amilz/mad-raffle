use anchor_lang::{prelude::*};
use solana_program::{pubkey::Pubkey};
use crate::{id::ID, constants::{RAFFLE_SEED}, utils::select_winner};

#[account]
pub struct RaffleTracker {
    pub current_raffle: u64,
    pub bump: u8,
    pub scoreboard: Vec<UserPoints>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct UserPoints {
    pub user: Pubkey,
    pub points: u32,
}
impl UserPoints {
    pub fn get_space() -> usize {
        32 + // user (Pubkey)
        4 // qty (u32)
    }
}

impl RaffleTracker {
    pub const CURRENT_RAFFLE_OFFSET: u64 = 8;
    pub const CURRENT_RAFFLE_BYTES: u64 = 8;
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
    pub fn get_space(user_score_count: usize) -> usize {
        8 + // discriminator
        8 + // tracker
        1 + // bump
        4 + // min vec space
        (UserPoints::get_space() * (user_score_count)) // tickets
    }
    pub fn add_points(&mut self, user: &Pubkey, num_points: u32) {
        let multiplier = self.calculate_multiplier();
        let points_to_add = num_points * multiplier;

        match self
            .scoreboard
            .iter_mut()
            .find(|score: &&mut UserPoints| score.user == *user)
        {
            Some(user) => user.points += points_to_add,
            None => self.scoreboard.push(UserPoints {
                user: *user,
                points: points_to_add,
            }),
        }
        msg!("Added {} points to {}", points_to_add, user);        
    }
    // Bonus multiplier for points, rewards early participants
    fn calculate_multiplier(&self) -> u32 {
        if self.current_raffle < 100 {
            // calculate linear decrease from 10 to 1 over rounds 1 to 99
            10 - ((self.current_raffle - 1) * 9 / 99) as u32
        } else {
            1
        }
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