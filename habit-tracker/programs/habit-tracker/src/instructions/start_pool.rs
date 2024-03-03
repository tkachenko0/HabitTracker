use crate::constants::{SEED_PROMISE, SEED_USER_DATA};
use crate::error::HabitTrackerError;
use crate::state::{Promise, UserData};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke_signed;
use anchor_lang::solana_program::system_instruction;

#[derive(Accounts)]
#[instruction(promise_id: String, amount: u64, deadline: u64, promise_message: String, num_voters: u64, message_len: u64)]
pub struct StartPoolCtx<'info> {
    #[account(mut)]
    pub promiser: Signer<'info>,
    #[account(
        init, 
        payer = promiser, 
        seeds = [
            SEED_PROMISE.as_ref(),
            promise_id.as_ref(),
            promiser.key().as_ref()
            ],
        bump,
        space = Promise::space(num_voters, message_len)
    )]
    pub promise: Account<'info, Promise>,
    #[account(
        mut,
        seeds = [SEED_USER_DATA.as_ref(), promiser.key().as_ref()],
        bump,
    )]
    pub promiser_data: Account<'info, UserData>,
    pub system_program: Program<'info, System>,
}

pub fn start_pool_handler(
    ctx: Context<StartPoolCtx>,
    promise_id: String,
    amount: u64,
    deadline: u64,
    promise_message: String,
    num_voters: u64,
    message_len: u64,
) -> Result<()> {
    msg!("Promise ID: {}", promise_id);
    msg!("Amount: {}", amount);
    msg!("Deadline: {}", deadline);

    let promiser = &mut ctx.accounts.promiser;
    let promise = &mut ctx.accounts.promise;
    let promiser_data = &mut ctx.accounts.promiser_data;

    let voters = ctx.remaining_accounts;

    require!(
        num_voters == voters.len() as u64,
        HabitTrackerError::InvalidVotersNumber
    );

    require!(
        promise_message.len() <= message_len as usize,
        HabitTrackerError::InvalidMessageLength
    );

    promise.init(
        promiser.key(),
        promise_message,
        amount,
        deadline,
        voters.to_vec(),
    );

    promiser_data.num_promises += 1;

    invoke_signed(
        &system_instruction::transfer(&promiser.key(), &promise.to_account_info().key, amount),
        &[promiser.to_account_info(), promise.to_account_info()],
        &[],
    )?;

    Ok(())
}
