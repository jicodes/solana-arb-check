use anchor_lang::prelude::*;
use anchor_spl::token::{spl_token, Mint, TokenAccount};


use crate::error::ErrorCode;
use crate::ArbState;

#[derive(Accounts)]
pub struct CheckProfit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        associated_token::mint = wsol_mint,  
        associated_token::authority = user
    )]
    pub wsol_account: Account<'info, TokenAccount>, 

    #[account(
        address = spl_token::native_mint::ID,
    )]
    pub wsol_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        seeds = [b"state", user.key().as_ref()],
        bump
    )]
    pub state: Account<'info, ArbState>,
}

impl CheckProfit<'_> {
    pub fn check_profit(&mut self, min_profit: u64) -> Result<()> {
        let state = &self.state;
        let wsol_account = &self.wsol_account;

        let final_balance = wsol_account.amount;
        let profit = final_balance
            .checked_sub(state.initial_balance)
            .ok_or(ErrorCode::Underflow)?;

        require!(profit >= min_profit, ErrorCode::NotProfitable);

        Ok(())
    }
}
