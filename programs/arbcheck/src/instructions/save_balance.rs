use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

use crate::constants::WSOL_MINT;
use crate::ArbState;

#[derive(Accounts)]
pub struct SaveBalance<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        associated_token::mint = WSOL_MINT,  
        associated_token::authority = user
    )]
    pub wsol_account: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = user,
        space = ArbState::INIT_SPACE,
        seeds = [b"state", user.key().as_ref()],
        bump
    )]
    pub state: Account<'info, ArbState>,
    pub system_program: Program<'info, System>,
}

impl SaveBalance<'_> {
    pub fn save_balance(&mut self) -> Result<()> {
        let wsol_balance = self.wsol_account.amount;
        msg!("WSOL balance: {}", wsol_balance);
        self.state.initial_balance = wsol_balance;
        Ok(())
    }
}
