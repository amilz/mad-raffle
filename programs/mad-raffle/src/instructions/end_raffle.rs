use std::str::FromStr;

use anchor_lang::prelude::*;
use anchor_spl::metadata::MetadataAccount;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

use crate::constants::{RAFFLE_SEED, TRACKER_SEED, COLLECTION_ADDRESS, NEW_RAFFLE_COST, POINTS_FOR_SELLING};
use crate::model::{RaffleError, PnftError};
use crate::state::{Raffle, RaffleTracker};
use crate::utils::{send_pnft, AuthorizationDataLocal};

#[derive(Accounts)]
pub struct EndRaffle<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub src: Box<Account<'info, TokenAccount>>,
    #[account(
        init,
        payer = owner,
        associated_token::mint = nft_mint,
        associated_token::authority = raffle,
    )]
    pub dest: Box<Account<'info, TokenAccount>>,
    pub nft_mint: Box<Account<'info, Mint>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    // pfnt
    /// CHECK: assert_decode_metadata + seeds below
    #[account(
        mut,
        seeds=[
            mpl_token_metadata::state::PREFIX.as_bytes(),
            mpl_token_metadata::id().as_ref(),
            nft_mint.key().as_ref(),
        ],
        seeds::program = mpl_token_metadata::id(),
        bump,
        constraint = nft_metadata.collection.as_ref().unwrap().verified == true @ PnftError::NotVerifiedByCollection,
        constraint = nft_metadata.collection.as_ref().unwrap().key == Pubkey::from_str(COLLECTION_ADDRESS).unwrap() @ PnftError::InvalidCollectionAddress    
    )]
    pub nft_metadata: Account<'info,MetadataAccount>,
    //note that MASTER EDITION and EDITION share the same seeds, and so it's valid to check them here
    /// CHECK: seeds below
    #[account(
        seeds=[
            mpl_token_metadata::state::PREFIX.as_bytes(),
            mpl_token_metadata::id().as_ref(),
            nft_mint.key().as_ref(),
            mpl_token_metadata::state::EDITION.as_bytes(),
        ],
        seeds::program = mpl_token_metadata::id(),
        bump
    )]
    pub edition: UncheckedAccount<'info>,
    /// CHECK: seeds below
    #[account(mut,
            seeds=[
                mpl_token_metadata::state::PREFIX.as_bytes(),
                mpl_token_metadata::id().as_ref(),
                nft_mint.key().as_ref(),
                mpl_token_metadata::state::TOKEN_RECORD_SEED.as_bytes(),
                src.key().as_ref()
            ],
            seeds::program = mpl_token_metadata::id(),
            bump
        )]
    pub owner_token_record: UncheckedAccount<'info>,
    /// CHECK: seeds below
    #[account(mut,
            seeds=[
                mpl_token_metadata::state::PREFIX.as_bytes(),
                mpl_token_metadata::id().as_ref(),
                nft_mint.key().as_ref(),
                mpl_token_metadata::state::TOKEN_RECORD_SEED.as_bytes(),
                dest.key().as_ref()
            ],
            seeds::program = mpl_token_metadata::id(),
            bump
        )]
    pub dest_token_record: UncheckedAccount<'info>,
    pub pnft_shared: ProgNftShared<'info>,
    //
    // remaining accounts could be passed, in this order:
    // - rules account
    // - mint_whitelist_proof
    // - creator_whitelist_proof
    #[account(
        mut, 
        seeds = [
            RAFFLE_SEED.as_ref(),
            &(tracker.current_raffle).to_le_bytes(),  
        ],
        bump = raffle.bump
    )]
    pub raffle: Box<Account<'info, Raffle>>,
    #[account(
        init, 
        payer = owner, 
        space = Raffle::get_space(0),
        seeds = [
            RAFFLE_SEED.as_ref(),
            &(tracker.current_raffle + 1).to_le_bytes(),  
        ],
        bump
    )]
    pub new_raffle: Box<Account<'info, Raffle>>,
    #[account(
        mut,
        seeds = [TRACKER_SEED.as_ref()],
        bump = tracker.bump,
        realloc = RaffleTracker::get_space((tracker.scoreboard.len() + 1 ) as usize),
        realloc::payer = owner,
        realloc::zero = false
    )]
    pub tracker: Box<Account<'info, RaffleTracker>>,
    #[account(mut)]
    pub creator1: Option<AccountInfo<'info>>,
    #[account(mut)]
    pub creator2: Option<AccountInfo<'info>>,
    #[account(mut)]
    pub creator3: Option<AccountInfo<'info>>,
    #[account(mut)]
    pub creator4: Option<AccountInfo<'info>>,
    #[account(mut)]
    pub creator5: Option<AccountInfo<'info>>,
}


pub fn end_raffle<'info>(
    ctx: Context<'_, '_, '_, 'info, EndRaffle<'info>>,
    authorization_data: Option<AuthorizationDataLocal>,
    rules_acc_present: bool,
) -> Result<()> {
    let raffle = &mut ctx.accounts.raffle;
    let seller = &mut ctx.accounts.owner;
    let tracker = &mut ctx.accounts.tracker;
    let new_raffle = &mut ctx.accounts.new_raffle;
    let nft_mint = &ctx.accounts.nft_mint;
    let ata = &ctx.accounts.dest;
    // Verify raffle is active and has sold some tickets
    let total_tickets: u32 = raffle.tickets.iter().map(|holder| holder.qty as u32).sum();
    require!(raffle.active, RaffleError::NotActive);
    require!(total_tickets > 0, RaffleError::NoTickets);

    let rem_acc = &mut ctx.remaining_accounts.iter();
    let auth_rules = if rules_acc_present {
        Some(next_account_info(rem_acc)?)
    } else {
        None
    };
    send_pnft(
        &seller.to_account_info(),
        &seller.to_account_info(),
        &ctx.accounts.src,
        &ctx.accounts.dest,
        &raffle.to_account_info(),
        &ctx.accounts.nft_mint,
        &ctx.accounts.nft_metadata,
        &ctx.accounts.edition,
        &ctx.accounts.system_program,
        &ctx.accounts.token_program,
        &ctx.accounts.associated_token_program,
        &ctx.accounts.pnft_shared.instructions,
        &ctx.accounts.owner_token_record,
        &ctx.accounts.dest_token_record,
        &ctx.accounts.pnft_shared.authorization_rules_program,
        auth_rules,
        authorization_data,
        None,
    )?;

    let metadata = &mut ctx.accounts.nft_metadata;
    let empty_vec = vec![];
    let creators = metadata.data.creators.as_ref().unwrap_or(&empty_vec);

    // Calculate payment amount and royalty amount
    // Leave enough lamports in the account to cover rent
    let rent_required = Rent::get()?.minimum_balance(Raffle::get_space(raffle.tickets.len() + 1 as usize));
    let current_raffle_lamports: u64 = raffle.to_account_info().lamports();
    let available_balance: u64 = current_raffle_lamports.saturating_sub(rent_required + NEW_RAFFLE_COST);
    let seller_fee_basis_points = metadata.data.seller_fee_basis_points as u64;
    let total_rate: u64 = 10000; // BPS 100% rate
    
    let payment_to_seller = (available_balance * total_rate) / (total_rate + seller_fee_basis_points);
    let royalties_payment: u64 = available_balance - payment_to_seller;

    let creator_accounts = [
        ctx.accounts.creator1.as_ref(),
        ctx.accounts.creator2.as_ref(),
        ctx.accounts.creator3.as_ref(),
        ctx.accounts.creator4.as_ref(),
        ctx.accounts.creator5.as_ref(),
    ];
    let mut royalties_paid = 0;
    let min_creator_rent = Rent::get()?.minimum_balance(0);

    for creator in creators.iter() {
        // Find the account that matches the current creator
        if let Some(creator_account) = creator_accounts.iter().find(|account| {
            account.map_or(false, |account| account.key() == creator.address)
        }) {
            let creator_payment = (royalties_payment * creator.share as u64) / 100;
    
            // Create a let binding for the AccountInfo object
            let creator_account_info = creator_account.unwrap().to_account_info();
            let mut creator_lamports = creator_account_info.try_borrow_mut_lamports()?;
            let creator_balance = **creator_lamports;
    
            // Don't send if the creator's balance is too low to pay rent (cause tx to fail)
            if (creator_balance + creator_payment) > min_creator_rent {
                royalties_paid += creator_payment;
                **creator_lamports += creator_payment;
            }
        }
    }
    
    // Raffle pays for the SOL to the NFT seller, royalties to creator
    **raffle.to_account_info().try_borrow_mut_lamports()? -= payment_to_seller + royalties_paid;
    **seller.to_account_info().try_borrow_mut_lamports()? += payment_to_seller;

    // Update raffle state
    raffle.end_raffle(
        nft_mint.key(),
        ata.key()
    );
    // Increment the raffle counter and initialize the new raffle
    tracker.increment();
    msg!("New raffle to be created: {}", tracker.current_raffle);
    new_raffle.initialize(
        tracker.current_raffle,
        *ctx.bumps.get("new_raffle").unwrap(),
    );
    // Add bonus points to the seller
    tracker.add_points(&seller.key, POINTS_FOR_SELLING);

    Ok(())
}

#[derive(Accounts)]
pub struct ProgNftShared<'info> {
    //can't deserialize directly coz Anchor traits not implemented
    /// CHECK: address below
    #[account(address = mpl_token_metadata::id())]
    pub token_metadata_program: UncheckedAccount<'info>,

    //sysvar ixs don't deserialize in anchor
    /// CHECK: address below
    #[account(address = anchor_lang::solana_program::sysvar::instructions::ID)]
    pub instructions: UncheckedAccount<'info>,

    /// CHECK: address below
    #[account(address = mpl_token_auth_rules::id())]
    pub authorization_rules_program: UncheckedAccount<'info>,
}
// --------------------------------------- replicating mplex type for anchor IDL export
//have to do this because anchor won't include foreign structs in the IDL