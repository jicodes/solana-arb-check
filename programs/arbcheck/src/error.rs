use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Profit is not enough after tip")]
    NotProfitable,
    #[msg("Underflow in calculation")]
    Underflow,
}
