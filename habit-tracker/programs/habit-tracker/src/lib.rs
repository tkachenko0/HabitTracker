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
    ) -> Result<()> {
        msg!("Promise ID: {}", promise_id);
        msg!("Amount: {}", amount);
        msg!("Deadline: {}", deadline);

        let promiser = &mut ctx.accounts.promiser;
        let promise = &mut ctx.accounts.promise;
        let promiser_data = &mut ctx.accounts.promiser_data;

        promise.init(
            promiser.key(),
            promise_message,
            amount,
            deadline,
            ctx.accounts.voter1.key(),
            ctx.accounts.voter2.key(),
            ctx.accounts.voter3.key(),
        );
        promiser_data.num_promises += 1;

        let transfer_instruction = system_instruction::transfer(
            &promiser.key(), 
            &promise.to_account_info().key, 
            amount
        );
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

#[account]
#[derive(InitSpace)]
pub struct Promise {
    pub promiser: Pubkey,
    pub promise_message: [u8; 95],
    pub amount: u64,
    pub deadline: u64,
    pub voter1: Pubkey,
    pub voter1_has_voted: bool,
    pub voter1_chiose: bool,
    pub voter2: Pubkey,
    pub voter2_has_voted: bool,
    pub voter2_chiose: bool,
    pub voter3: Pubkey,
    pub voter3_has_voted: bool,
    pub voter3_chiose: bool,
}

impl Promise {
    pub fn init(
        &mut self,
        promiser: Pubkey,
        promise_message: String,
        amount: u64,
        deadline: u64,
        voter1: Pubkey,
        voter2: Pubkey,
        voter3: Pubkey,
    ) {
        self.promiser = promiser;
        self.promise_message = promise_message.as_bytes().try_into().unwrap();
        self.amount = amount;
        self.deadline = deadline;
        self.voter1 = voter1;
        self.voter1_has_voted = false;
        self.voter1_chiose = false;
        self.voter2 = voter2;
        self.voter2_has_voted = false;
        self.voter2_chiose = false;
        self.voter3 = voter3;
        self.voter3_has_voted = false;
        self.voter3_chiose = false;
    }

    pub fn vote(&mut self, voter: Pubkey, chiose: bool) -> Result<()> {
        require!(self.is_valid_voter(voter), HabitTrackerError::InvalidVoter);
        if self.voter1 == voter {
            require!(!self.voter1_has_voted, HabitTrackerError::VoterAlreadyVoted);
            self.voter1_has_voted = true;
            self.voter1_chiose = chiose;
        } else if self.voter2 == voter {
            require!(!self.voter2_has_voted, HabitTrackerError::VoterAlreadyVoted);
            self.voter2_has_voted = true;
            self.voter2_chiose = chiose;
        } else if self.voter3 == voter {
            require!(!self.voter3_has_voted, HabitTrackerError::VoterAlreadyVoted);
            self.voter3_has_voted = true;
            self.voter3_chiose = chiose;
        }
        Ok(())
    }

    pub fn all_voted(&self) -> bool {
        self.voter1_has_voted && self.voter2_has_voted && self.voter3_has_voted
    }

    pub fn was_respected(&self) -> bool {
        self.voter1_chiose && self.voter2_chiose && self.voter3_chiose
    }

    pub fn is_valid_voter(&self, voter: Pubkey) -> bool {
        self.voter1 == voter || self.voter2 == voter || self.voter3 == voter
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
#[instruction(promise_id: String)]
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
        space = 8 + Promise::INIT_SPACE
    )]
    pub promise: Account<'info, Promise>,
    #[account(
        mut,
        seeds = [b"UserData", promiser.key().as_ref()],
        bump,
    )]
    pub promiser_data: Account<'info, UserData>,
    pub system_program: Program<'info, System>,
    pub voter1: SystemAccount<'info>,
    pub voter2: SystemAccount<'info>,
    pub voter3: SystemAccount<'info>,
}

#[derive(Accounts)]
#[instruction(promise_id: String)]
pub struct VotingCtx<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,
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
}
