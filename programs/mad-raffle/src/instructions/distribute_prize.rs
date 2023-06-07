use std::str::FromStr;

use anchor_lang::prelude::*;
use anchor_spl::metadata::MetadataAccount;
use anchor_spl::token::{CloseAccount, self};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

use crate::constants::{RAFFLE_SEED, COLLECTION_ADDRESS, AUTHORITY};
use crate::model::{RaffleError, PnftError, PrizeError};
use crate::state::Raffle;
use crate::utils::{send_pnft, AuthorizationDataLocal};

#[derive(Accounts)]
#[instruction(raffle_id: u64)]
pub struct DistributePrize<'info> {
    #[account(
        mut,
        //address = Pubkey::from_str(AUTHORITY).unwrap() @ RaffleError::UnauthorizedSigner
    )]
    pub authority: Signer<'info>,
    #[account(
        mut,
        constraint = raffle.winner.is_some() @ RaffleError::WinnerNotSelected,  // Checks that a winner has been selected
        address = raffle.winner.unwrap() @ PrizeError::InvalidWinner,           // Checks that the address is the winner
    )]
    pub winner: SystemAccount<'info>,
    #[account(
        mut,
        associated_token::mint = nft_mint,
        associated_token::authority = raffle,
    )]
    pub src: Box<Account<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = nft_mint,
        associated_token::authority = winner,
    )]
    pub dest: Box<Account<'info, TokenAccount>>,
    #[account(
        constraint = raffle.prize.is_some() @ PrizeError::NoPrizeInRaffle,
        address = *raffle.prize.as_ref().map(|p| &p.mint).unwrap() @ PrizeError::InvalidPrizeMint
    )]
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
            &(raffle_id).to_le_bytes(),  
        ],
        bump = raffle.bump,
        constraint = raffle.id == raffle_id @ RaffleError::RafflePdaMismatch,
        constraint = !raffle.active @ RaffleError::StillActive,
    )]
    pub raffle: Box<Account<'info, Raffle>>
}

pub fn distribute_prize<'info>(
    ctx: Context<'_, '_, '_, 'info, DistributePrize<'info>>,
    _raffle_id: u64,
    authorization_data: Option<AuthorizationDataLocal>,
    rules_acc_present: bool,
) -> Result<()> {
    require!(
        *ctx.accounts.authority.key == ctx.accounts.raffle.winner.unwrap() || 
        *ctx.accounts.authority.key == Pubkey::from_str(AUTHORITY).unwrap(),
        PrizeError::UnauthorizedDistributor
    );

    let rem_acc = &mut ctx.remaining_accounts.iter();
    let auth_rules = if rules_acc_present {
        Some(next_account_info(rem_acc)?)
    } else {
        None
    };
    send_pnft(
        &ctx.accounts.raffle.to_account_info(),
        &ctx.accounts.authority.to_account_info(),
        &ctx.accounts.src,
        &ctx.accounts.dest,
        &ctx.accounts.winner.to_account_info(),
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
        Some(&ctx.accounts.raffle)
    )?;

    if let Some(prize) = &mut ctx.accounts.raffle.prize {
        prize.sent = true;
    }

    // Close the Raffle's token account
    let raffle = &mut ctx.accounts.raffle;
    let num_raffle_bytes = &(raffle.id).to_le_bytes();
    let bump = &[raffle.bump];
    // Should match raffle pda
    let signer_seeds: &[&[&[u8]]] = &[&[
        RAFFLE_SEED.as_ref(),
        num_raffle_bytes,
        bump,
    ]];
    let close_context = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        CloseAccount {
            account: ctx.accounts.src.to_account_info(),
            destination: ctx.accounts.authority.to_account_info(),
            authority: ctx.accounts.raffle.to_account_info(),
        } 
    );
    token::close_account(close_context.with_signer(signer_seeds))?;

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