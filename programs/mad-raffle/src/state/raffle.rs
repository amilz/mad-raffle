use anchor_lang::{prelude::*, InstructionData};
use solana_program::{pubkey::Pubkey, instruction::Instruction, system_program};
use crate::{id::ID, constants::{RAFFLE_SEED}, utils::select_winner};

#[account]
pub struct RaffleTracker {
    pub current_raffle: u64,
    pub bump: u8,
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
    pub winner: Option<Pubkey>
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
        8 +// end time
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
    pub fn end_raffle(&mut self) {
        self.active = false;
        self.end_time = Clock::get().unwrap().unix_timestamp;
        self.select_winner();
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
    pub fn new_raffle_instruction(
        next_raffle_pda: &Pubkey,
        tracker: &AccountInfo,
        thread: &AccountInfo,
        thread_authority: &AccountInfo,
        payer_pubkey: &Pubkey,
    ) -> Instruction {
        Instruction {
            program_id: ID,
            accounts: crate::accounts::NextRaffle {
                new_raffle: *next_raffle_pda,
                tracker: tracker.key(),
                thread: thread.key(),
                thread_authority: thread_authority.key(),
                system_program: system_program::id(),
                clockwork_program: clockwork_sdk::ID,
                payer: *payer_pubkey,
            }
            .to_account_metas(Some(true)),
            data: crate::instruction::NextRaffle {}.data(),
        }
    }
    fn select_winner(&mut self) {
        match select_winner(self) {
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