use anchor_lang::prelude::*;

#[account]
pub struct ArbState {
    pub initial_balance: u64,
}

impl Space for ArbState {
    const INIT_SPACE: usize = 8 + 8;
}
