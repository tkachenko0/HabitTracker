use crate::constants::SEED_USER_DATA;
use crate::state::UserData;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct RegisterUserCtx<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init_if_needed, 
        payer = user, 
        seeds = [SEED_USER_DATA.as_ref(), user.key().as_ref()],
        bump,
        space = 8 + UserData::INIT_SPACE
    )]
    pub promiser_data: Account<'info, UserData>,
    pub system_program: Program<'info, System>,
}

pub fn register_user_handler(_ctx: Context<RegisterUserCtx>) -> Result<()> {
    Ok(())
}
