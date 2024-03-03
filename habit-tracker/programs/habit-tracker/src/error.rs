use anchor_lang::prelude::*;

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

    #[msg("The number of invites is invalid")]
    InvalidInvitesNumber,

    #[msg("The message length is invalid")]
    InvalidMessageLength,

    #[msg("Voter account not found among remaining accounts.")]
    VoterAccountNotFound,

    #[msg("Invalid invite account.")]
    InvalidInviteAccount,
}
