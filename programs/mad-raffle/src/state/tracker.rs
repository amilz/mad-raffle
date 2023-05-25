use anchor_lang::{prelude::*};
use solana_program::{pubkey::Pubkey};
use crate::{id::ID, constants::{RAFFLE_SEED}};

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