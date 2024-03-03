use anchor_lang::prelude::*;

#[account]
pub struct UserInvites {
    pub invites: Vec<Pubkey>,
}

impl UserInvites {
    pub fn add_invite(&mut self, promise_pubkey: Pubkey) {
        self.invites.push(promise_pubkey);
    }

    pub const fn space(num_invites: u64) -> usize {
        (8 + (4 + (num_invites * 32))) as usize
    }

    pub const SPACE_FOR_NEW_INVITE: usize = 32;
}
