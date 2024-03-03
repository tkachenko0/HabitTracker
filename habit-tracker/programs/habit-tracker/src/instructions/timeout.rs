use crate::constants::SEED_PROMISE;
use crate::error::HabitTrackerError;
use crate::state::Promise;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(promise_id: String)]
pub struct TimeoutCtx<'info> {
    #[account(mut)]
    pub promiser: Signer<'info>,
    #[account(
        mut,
        seeds = [
            SEED_PROMISE.as_ref(),
            promise_id.as_ref(),
            promiser.key().as_ref()
            ],
        bump,
        close = promiser
    )]
    pub promise: Account<'info, Promise>,
}

pub fn timeout_handler(ctx: Context<TimeoutCtx>, promise_id: String) -> Result<()> {
    msg!("Promise ID: {}", promise_id);
    let promiser = &ctx.accounts.promiser;
    let promise = &mut ctx.accounts.promise;
    require!(
        Clock::get()?.slot >= promise.deadline,
        HabitTrackerError::DeadlineNotReached
    );
    require!(!promise.all_voted(), HabitTrackerError::PromiseAlreadyVoted);

    let amount = promise.amount;
    **promise.to_account_info().try_borrow_mut_lamports()? -= amount;
    **promiser.to_account_info().try_borrow_mut_lamports()? += amount;
    Ok(())
}
