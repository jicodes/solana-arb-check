pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("7xNxrvV9454Eo9whXXkXdKEVoMsw2V9sEiQPkpNiYAxx");

#[program]
pub mod arbcheck {
    use super::*;

    pub fn save_balance(ctx: Context<SaveBalance>) -> Result<()> {
        ctx.accounts.save_balance()
    }
    pub fn check_profit(ctx: Context<CheckProfit>, min_profit: u64) -> Result<()> {
        ctx.accounts.check_profit(min_profit)
    }
}
