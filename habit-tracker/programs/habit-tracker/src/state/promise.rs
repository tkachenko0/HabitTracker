use crate::error::HabitTrackerError;
use anchor_lang::prelude::*;

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

    pub fn vote(&mut self, voter: Pubkey, choice: bool) -> Result<()> {
        require!(self.is_valid_voter(voter), HabitTrackerError::InvalidVoter);
        require!(!self.has_voted(voter), HabitTrackerError::VoterAlreadyVoted);
        let vote = if choice {
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
            if vote_info.voter == voter {
                return vote_info.vote != VoteStatus::NotVotedYet;
            }
        }
        return false;
    }

    pub fn all_voted(&self) -> bool {
        for vote_info in self.votes.iter() {
            if vote_info.vote == VoteStatus::NotVotedYet {
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
            if vote_info.voter == voter {
                return true;
            }
        }
        return false;
    }

    pub const fn space(num_voters: u64, message_len: u64) -> usize {
        (8 + 32 + (4 + message_len) + 8 + 8 + (4 + (num_voters * VoteInfo::INIT_SPACE as u64)))
            as usize
    }
}
