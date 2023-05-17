use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    native_token::LAMPORTS_PER_SOL, system_program
};
use clockwork_sdk::state::{Thread, ThreadResponse, Trigger};
use clockwork_sdk::utils::PAYER_PUBKEY;

use crate::constants::{RAFFLE_SEED, TRACKER_SEED, THREAD_AUTHORITY_SEED};
use crate::id::ID;
use crate::model::RaffleError;
use crate::state::{RaffleTracker, Raffle};
use crate::utils::select_winner;

#[derive(Accounts)]
pub struct NextRaffle<'info> {
    /// Verify that only this thread can execute the Increment Instruction
    #[account(mut, constraint = thread.authority.eq(&thread_authority.key()))]
    pub thread: Account<'info, Thread>,

    /// The Thread Admin
    /// The authority that was used as a seed to derive the thread address
    /// `thread_authority` should equal `thread.thread_authority`
    #[account(mut, seeds = [THREAD_AUTHORITY_SEED.as_ref()], bump)]
    pub thread_authority: SystemAccount<'info>,

    #[account(
        seeds = [TRACKER_SEED.as_ref()],
        bump = tracker.bump
    )]
    pub tracker: Account<'info, RaffleTracker>, 

    // The Solana system program.
    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,

    /// The Clockwork thread program.
    #[account(address = clockwork_sdk::ID)]
    pub clockwork_program: Program<'info, clockwork_sdk::ThreadProgram>,
    
    /// The next raffle to be created
    #[account(
        init, 
        payer = payer,  // TODO update to clockwork_sdk::utils::PAYER_PUBKEY 
        space = Raffle::get_space(0),
        owner = ID,
        seeds = [
            RAFFLE_SEED.as_ref(),
            &(tracker.current_raffle).to_le_bytes(),
        ],
        bump
    )]
    pub new_raffle: Account<'info, Raffle>,
    /// CHECK (for some reason my address constraint isn't working)
    #[account(
        mut, 
        signer
     )]
    pub payer: AccountInfo<'info>,
    #[account(
        mut, 
        seeds = [
            RAFFLE_SEED.as_ref(),
            &(tracker.current_raffle - 1).to_le_bytes(),  
        ],
        bump = current_raffle.bump
    )]
    pub current_raffle: Account<'info, Raffle>,
}

/// Trigger response from the thread
/// Initiates new raffle and updates dynamic instruction of the thread
pub fn next_raffle(ctx:Context<NextRaffle>) -> Result<ThreadResponse> {
    let thread = &mut ctx.accounts.thread;
    let thread_authority = &mut ctx.accounts.thread_authority;
    let tracker: &mut Account<RaffleTracker> = &mut ctx.accounts.tracker;
    let new_raffle = &mut ctx.accounts.new_raffle;
    let current_raffle = &mut ctx.accounts.current_raffle;
    let (next_raffle_pda, _next_raffle_bump) = tracker.next_raffle_pda();
    require!(!new_raffle.active, RaffleError::RaffleAlreadyActive);

    // 1 - CREATE THE NEW RAFFLE
    new_raffle.initialize(
        tracker.current_raffle,
        *ctx.bumps.get("new_raffle").unwrap(),
    );

    // 2 - UPDATE THE DYNAMIC CLOCKWORK THREAD
    let new_raffle_ix = Raffle::new_raffle_instruction(
        &next_raffle_pda,
        &tracker.to_account_info(),
        &thread.to_account_info(),
        &thread_authority.to_account_info(),
        &PAYER_PUBKEY,
        &current_raffle.to_account_info()
    );
    // 3 - DETERMINE WINNER
    let winner_result = select_winner(current_raffle);
    if winner_result.is_ok() {
        current_raffle.winner = Some(winner_result.unwrap());
        msg!("The winner is {:?}", current_raffle.winner);
    }
    // 4 - UPDATE THREAD
    Ok(ThreadResponse {
        dynamic_instruction: Some(new_raffle_ix.into()),
        close_to: None,
        trigger: None,
    })
}

#[derive(Accounts)]
#[instruction(thread_id: Vec<u8>)]
pub struct CreateThread<'info> {
    /// The Clockwork thread program.
    #[account(address = clockwork_sdk::ID)]
    pub clockwork_program: Program<'info, clockwork_sdk::ThreadProgram>,

    /// The signer who will pay to initialize the program.
    /// (not to be confused with the thread executions). //TODO define a payer for the thread executions
    #[account(mut)]
    pub payer: Signer<'info>,

    /// The Solana system program.
    #[account(address = system_program::ID)]
    pub system_program: Program<'info, System>,

    /// Address to assign to the newly created thread.
    #[account(mut, address = Thread::pubkey(thread_authority.key(), thread_id))]
    pub thread: SystemAccount<'info>,

    /// The pda that will own and manage the thread.
    #[account(seeds = [THREAD_AUTHORITY_SEED.as_ref()], bump)]
    pub thread_authority: SystemAccount<'info>,

    #[account(
        seeds = [TRACKER_SEED.as_ref()],
        bump = tracker.bump
    )]
    pub tracker: Account<'info, RaffleTracker>,
    #[account(
        seeds = [
            RAFFLE_SEED.as_ref(),
            &(tracker.current_raffle).to_le_bytes(),  
        ],
        bump = current_raffle.bump
    )]
    pub current_raffle: Account<'info, Raffle>,
}

impl<'info> CreateThread<'info> {
    pub fn thread_create_ctx<'a, 'b, 'c>(
        &self,
        signer_seeds: &'a [&'b [&'c [u8]]],
    ) -> CpiContext<'a, 'b, 'c, 'info, clockwork_sdk::cpi::ThreadCreate<'info>> {
        let program = self.clockwork_program.to_account_info().clone();
        let accounts = clockwork_sdk::cpi::ThreadCreate {
            payer: self.payer.to_account_info().clone(),
            system_program: self.system_program.to_account_info().clone(),
            thread: self.thread.to_account_info().clone(),
            authority: self.thread_authority.to_account_info().clone(),
        };
        CpiContext::new_with_signer(program, accounts, signer_seeds)
    }
}





/// Creates a new thread that will trigger the next raffle when previous raffle ends.
pub fn create_thread(ctx: Context<CreateThread>, thread_id: Vec<u8>) -> Result<()> {
    // Get accounts.
    let thread: &SystemAccount = &ctx.accounts.thread;
    let thread_authority = &ctx.accounts.thread_authority;
    let tracker = &ctx.accounts.tracker;
    let current_raffle = &ctx.accounts.current_raffle;
    let (next_raffle_pda, _next_raffle_bump) = tracker.next_raffle_pda();

    // 1️⃣ Prepare an instruction to be automated.
    let new_raffle_ix = Raffle::new_raffle_instruction(
        &next_raffle_pda,
        &tracker.to_account_info(),
        &thread.to_account_info(),
        &thread_authority.to_account_info(),
        &PAYER_PUBKEY,
        &current_raffle.to_account_info()
    );  

    // 2️⃣ Define a trigger when tracker is updated.
    let trigger = Trigger::Account {
        address: tracker.key(),
        offset: RaffleTracker::CURRENT_RAFFLE_OFFSET,
        size: RaffleTracker::CURRENT_RAFFLE_BYTES,
    };

    // 3️⃣ Create thread via CPI.
    let bump = *ctx.bumps.get("thread_authority").unwrap();
    let signer_seeds: &[&[&[u8]]] = &[&[THREAD_AUTHORITY_SEED, &[bump]]];
    let cpi_ctx = ctx.accounts.thread_create_ctx(signer_seeds);
    clockwork_sdk::cpi::thread_create(cpi_ctx, LAMPORTS_PER_SOL, thread_id, vec![new_raffle_ix.into()], trigger)?;


    Ok(())
}