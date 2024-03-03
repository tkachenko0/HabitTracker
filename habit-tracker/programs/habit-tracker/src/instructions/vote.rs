use crate::constants::{SEED_PROMISE, SEED_USER_DATA};
use crate::error::HabitTrackerError;
use crate::state::{Promise, UserData};
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(promise_id: String)]
pub struct VotingCtx<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,
    #[account(mut)]
    pub promiser: SystemAccount<'info>,
    #[account(
        mut,
        seeds = [
            SEED_PROMISE.as_ref(),
            promise_id.as_ref(),
            promiser.key().as_ref()
            ],
        bump
    )]
    pub promise: Account<'info, Promise>,
    #[account(
        mut,
        seeds = [SEED_USER_DATA.as_ref(), promiser.key().as_ref()],
        bump,
    )]
    pub promiser_data: Account<'info, UserData>,
}

pub fn vote_handler(ctx: Context<VotingCtx>, promise_id: String, choice: bool) -> Result<()> {
    msg!("Promise ID: {}", promise_id);
    let voter = &mut ctx.accounts.voter;
    let promise = &mut ctx.accounts.promise;

    require!(
        Clock::get()?.slot < promise.deadline,
        HabitTrackerError::DeadlineReached
    );

    promise.vote(voter.key(), choice)?;

    if promise.all_voted() {
        distribute_rewards(ctx)?;
    }

    Ok(())
}

fn distribute_rewards(ctx: Context<VotingCtx>) -> Result<()> {
    let promise = &mut ctx.accounts.promise;
    let amount = promise.amount;

    if promise.was_respected() {
        transfer_lamports(
            &promise.to_account_info(),
            &ctx.accounts.promiser.to_account_info(),
            amount,
        )?;
        ctx.accounts.promiser_data.num_respected_promises += 1;
    } else {
        let amount_to_voter = amount / promise.votes.len() as u64;
        for voter_info in promise.votes.iter() {
            let voter_account = ctx
                .remaining_accounts
                .iter()
                .find(|account| account.key() == voter_info.voter)
                .ok_or(HabitTrackerError::VoterAccountNotFound)?;
            transfer_lamports(&promise.to_account_info(), voter_account, amount_to_voter)?;
        }
    }
    Ok(())
}

fn transfer_lamports(from: &AccountInfo, to: &AccountInfo, amount: u64) -> Result<()> {
    **from.try_borrow_mut_lamports()? -= amount;
    **to.try_borrow_mut_lamports()? += amount;
    Ok(())
}
