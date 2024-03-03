use crate::constants::{SEED_PROMISE, SEED_USER_DATA, SEED_USER_INVITE};
use crate::error::HabitTrackerError;
use crate::state::{Promise, UserData, UserInvites};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke_signed;
use anchor_lang::solana_program::system_instruction;
use anchor_lang::Discriminator;

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

pub fn start_pool_handler<'info>(
    ctx: Context<'_, '_, '_, 'info, StartPoolCtx<'info>>,
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

    let voters = &ctx.remaining_accounts[..num_voters as usize];
    let invites = &ctx.remaining_accounts[num_voters as usize..];

    require!(
        num_voters == voters.len() as u64,
        HabitTrackerError::InvalidVotersNumber
    );

    require!(
        num_voters == invites.len() as u64,
        HabitTrackerError::InvalidInvitesNumber
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

    for (i, invite) in invites.iter().enumerate() {
        let voter = &voters[i];

        msg!("Invite: {:?}", invite.key);

        if invite.lamports() == 0 {
            msg!("Creating Invite Account {:?}", invite.key);
            let (invite_pda, bump) = Pubkey::find_program_address(
                &[SEED_USER_INVITE.as_bytes(), voter.key.as_ref()],
                ctx.program_id,
            );

            require!(
                invite_pda == *invite.key,
                HabitTrackerError::InvalidInviteAccount
            );

            let space = UserInvites::space(1);
            let rent = Rent::get()?.minimum_balance(space);

            invoke_signed(
                &system_instruction::create_account(
                    promiser.key,
                    invite.key,
                    rent,
                    space as u64,
                    ctx.program_id,
                ),
                &[
                    promiser.to_account_info().clone(),
                    invite.clone(),
                    ctx.accounts.system_program.to_account_info().clone(),
                ],
                &[&[SEED_USER_INVITE.as_bytes(), voter.key.as_ref(), &[bump]]],
            )?;

            let discriminator = UserInvites::discriminator();
            discriminator.serialize(&mut &mut invite.data.borrow_mut()[..8])?;
            let mut data = invite.try_borrow_mut_data()?;
            let mut decoded_account =
                UserInvites::try_deserialize(&mut data.as_ref()).expect("Error Deserializing Data");
            decoded_account.invites.push(promise.key());
            decoded_account.try_serialize(&mut data.as_mut())?;
        } else {
            msg!("Invite Account Already Exists {:?}", invite.key);
            let current_size = invite.data_len();
            let new_size = current_size + UserInvites::SPACE_FOR_NEW_INVITE;
            let new_minimum_balance = Rent::get()?.minimum_balance(new_size);
            let lamports_diff = new_minimum_balance.saturating_sub(invite.lamports());
            invoke_signed(
                &system_instruction::transfer(
                    &promiser.key(),
                    &invite.to_account_info().key,
                    lamports_diff,
                ),
                &[promiser.to_account_info(), invite.to_account_info()],
                &[],
            )?;
            invite.realloc(new_size, false)?;
            let mut data = invite.try_borrow_mut_data()?;
            let mut decoded_account =
                UserInvites::try_deserialize(&mut data.as_ref()).expect("Error Deserializing Data");
            decoded_account.invites.push(promise.key());
            decoded_account.try_serialize(&mut data.as_mut())?;
        }
    }

    Ok(())
}
