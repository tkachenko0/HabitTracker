use anchor_lang::prelude::*;

pub mod instructions;
pub use instructions::*;

pub mod state;
pub use state::*;

pub mod constants;
pub use constants::*;

pub mod error;
pub use error::*;

declare_id!("HabTbz4qE9B6tXJvEn9g2on1fmZ5CtX8zVWUK1Xn7ewR");

#[program]
pub mod habit_tracker {
    use super::*;

    pub fn register_user(ctx: Context<RegisterUserCtx>) -> Result<()> {
        register_user_handler(ctx)
    }

    pub fn start_pool<'info>(
        ctx: Context<'_, '_, '_, 'info, StartPoolCtx<'info>>,
        promise_id: String,
        amount: u64,
        deadline: u64,
        promise_message: String,
        num_voters: u64,
        message_len: u64,
    ) -> Result<()> {
        start_pool_handler(
            ctx,
            promise_id,
            amount,
            deadline,
            promise_message,
            num_voters,
            message_len,
        )
    }

    pub fn vote(ctx: Context<VotingCtx>, promise_id: String, choice: bool) -> Result<()> {
        vote_handler(ctx, promise_id, choice)
    }

    pub fn timeout(ctx: Context<TimeoutCtx>, promise_id: String) -> Result<()> {
        timeout_handler(ctx, promise_id)
    }
}
