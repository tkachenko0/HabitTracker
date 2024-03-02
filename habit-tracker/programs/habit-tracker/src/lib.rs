use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke_signed;
use anchor_lang::solana_program::system_instruction;

declare_id!("HabTbz4qE9B6tXJvEn9g2on1fmZ5CtX8zVWUK1Xn7ewR");

#[program]
pub mod habit_tracker {
    use super::*;

    pub fn register_user(_ctx: Context<RegisterUserCtx>) -> Result<()> {
        // do not override num_promises
        Ok(())
    }

    pub fn start_pool(
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

        let transfer_instruction =
            system_instruction::transfer(&promiser.key(), &promise.to_account_info().key, amount);
        invoke_signed(
            &transfer_instruction,
            &[promiser.to_account_info(), promise.to_account_info()],
            &[],
        )?;

        Ok(())
    }

    pub fn vote(ctx: Context<VotingCtx>, promise_id: String, chiose: bool) -> Result<()> {
        msg!("Promise ID: {}", promise_id);
        let voter = &mut ctx.accounts.voter;
        let promise = &mut ctx.accounts.promise;
        let promiser = &ctx.accounts.promiser;
        let promiser_data = &mut ctx.accounts.promiser_data;

        require!(
            Clock::get()?.slot < promise.deadline,
            HabitTrackerError::DeadlineReached
        );

        promise.vote(voter.key(), chiose)?;

        if promise.all_voted() {
            let amount = promise.amount;

            if promise.was_respected() {
                promiser_data.increment_respected_promises();
                **promise.to_account_info().try_borrow_mut_lamports()? -= amount;
                **promiser.to_account_info().try_borrow_mut_lamports()? += amount;
            } else {
                let amount_to_voter = amount / 3;

                require!(
                    promise.is_valid_voter(voter.key()),
                    HabitTrackerError::InvalidVoter
                );
                **promise.to_account_info().try_borrow_mut_lamports()? -= amount_to_voter;
                **voter.to_account_info().try_borrow_mut_lamports()? += amount_to_voter;

                for other_voter in ctx.remaining_accounts.iter() {
                    require!(
                        promise.is_valid_voter(other_voter.key()),
                        HabitTrackerError::InvalidVoter
                    );
                    **promise.to_account_info().try_borrow_mut_lamports()? -= amount_to_voter;
                    **other_voter.to_account_info().try_borrow_mut_lamports()? += amount_to_voter;
                }
            }
        }

        Ok(())
    }

    pub fn timeout(ctx: Context<TimeoutCtx>, promise_id: String) -> Result<()> {
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
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum VoteStatus {
    NotVotedYet,
    Yes,
    No,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct VoteInfo {
    pub voter: Pubkey,
    pub vote: VoteStatus,
}


#[account]
pub struct Promise {
    pub promiser: Pubkey,
    pub promise_message: String,
    pub amount: u64,
    pub deadline: u64,
    pub votes: Vec<VoteInfo>,
}

impl Promise {
    pub fn init(
        &mut self,
        promiser: Pubkey,
        promise_message: String,
        amount: u64,
        deadline: u64,
        voters: Vec<AccountInfo>,
    ) {
        self.promiser = promiser;
        self.promise_message = promise_message;
        self.amount = amount;
        self.deadline = deadline;
        self.votes = voters
            .iter()
            .map(|voter| VoteInfo {
                voter: *voter.key,
                vote: VoteStatus::NotVotedYet,
            })
            .collect();
    }

    pub fn vote(&mut self, voter: Pubkey, chiose: bool) -> Result<()> {
        require!(self.is_valid_voter(voter), HabitTrackerError::InvalidVoter);
        require!(!self.has_voted(voter), HabitTrackerError::VoterAlreadyVoted);
        let vote = if chiose {
            VoteStatus::Yes
        } else {
            VoteStatus::No
        };
        for vote_info in self.votes.iter_mut() {
            if vote_info.voter == voter {
                vote_info.vote = vote;
                break;
            }
        }
        Ok(())
    }

    pub fn has_voted(&self, voter: Pubkey) -> bool {
        for vote_info in self.votes.iter() {
            if vote_info.voter == voter{
                return vote_info.vote != VoteStatus::NotVotedYet;
            }
        }
        return false;
    }

    pub fn all_voted(&self) -> bool {
        for vote_info in self.votes.iter() {
            if vote_info.vote == VoteStatus:: NotVotedYet{
                return false;
            }
        }
        return true;
    }

    pub fn was_respected(&self) -> bool {
        let mut yes_votes = 0;
        let mut no_votes = 0;

        for vote_info in self.votes.iter() {
            match vote_info.vote {
                VoteStatus::Yes => yes_votes += 1,
                VoteStatus::No => no_votes += 1,
                _ => {}
            }
        }

        yes_votes > no_votes
    }

    pub fn is_valid_voter(&self, voter: Pubkey) -> bool {
        for vote_info in self.votes.iter() {
            if vote_info.voter == voter{
                return true;
            }
        }
        return false;
    }

    pub const fn space(num_voters: u64, message_len: u64) -> usize {
        (8 + 32 + (4 + message_len) + 8 + 8 + (4 + (num_voters * VoteInfo::INIT_SPACE as u64))) as usize
    }

}

#[account]
#[derive(InitSpace)]
pub struct UserData {
    pub num_promises: u64,
    pub num_respected_promises: u64,
}

impl UserData {
    pub fn increment_respected_promises(&mut self) {
        self.num_respected_promises += 1;
    }
}

#[derive(Accounts)]
pub struct RegisterUserCtx<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init_if_needed, 
        payer = user, 
        seeds = [b"UserData", user.key().as_ref()],
        bump,
        space = 8 + UserData::INIT_SPACE
    )]
    pub promiser_data: Account<'info, UserData>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(promise_id: String, amount: u64, deadline: u64, promise_message: String, num_voters: u64, message_len: u64)]
pub struct StartPoolCtx<'info> {
    #[account(mut)]
    pub promiser: Signer<'info>,
    #[account(
        init, 
        payer = promiser, 
        seeds = [
            "Promise".as_ref(),
            promise_id.as_ref(),
            promiser.key().as_ref()
            ],
        bump,
        space = Promise::space(num_voters, message_len)
    )]
    pub promise: Account<'info, Promise>,
    #[account(
        mut,
        seeds = [b"UserData", promiser.key().as_ref()],
        bump,
    )]
    pub promiser_data: Account<'info, UserData>,
    pub system_program: Program<'info, System>,
}

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
            "Promise".as_ref(),
            promise_id.as_ref(),
            promiser.key().as_ref()
            ],
        bump
    )]
    pub promise: Account<'info, Promise>,
    #[account(
        mut,
        seeds = [b"UserData", promiser.key().as_ref()],
        bump,
    )]
    pub promiser_data: Account<'info, UserData>,
}

#[derive(Accounts)]
#[instruction(promise_id: String)]
pub struct TimeoutCtx<'info> {
    #[account(mut)]
    pub promiser: Signer<'info>,
    #[account(
        mut,
        seeds = [
            "Promise".as_ref(),
            promise_id.as_ref(),
            promiser.key().as_ref()
            ],
        bump,
        close = promiser
    )]
    pub promise: Account<'info, Promise>,
}

#[error_code]
pub enum HabitTrackerError {
    #[msg("Invalid voter")]
    InvalidVoter,

    #[msg("The voter already voted")]
    VoterAlreadyVoted,

    #[msg("The promise was already voted by all voters")]
    PromiseAlreadyVoted,

    #[msg("The timeout slot was not reached")]
    DeadlineNotReached,

    #[msg("The timeout slot was reached")]
    DeadlineReached,

    #[msg("The number of voters is invalid")]
    InvalidVotersNumber,

    #[msg("The message length is invalid")]
    InvalidMessageLength,
}
