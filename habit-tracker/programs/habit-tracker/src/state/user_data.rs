use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct UserData {
    pub num_promises: u64,
    pub num_respected_promises: u64,
}
