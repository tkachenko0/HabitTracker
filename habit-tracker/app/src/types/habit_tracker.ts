export type HabitTracker = {
  "version": "0.1.0",
  "name": "habit_tracker",
  "constants": [
    {
      "name": "SEED_PROMISE",
      "type": "string",
      "value": "\"Promise\""
    },
    {
      "name": "SEED_USER_DATA",
      "type": "string",
      "value": "\"UserData\""
    },
    {
      "name": "SEED_USER_INVITE",
      "type": "string",
      "value": "\"UserInvites\""
    }
  ],
  "instructions": [
    {
      "name": "registerUser",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "promiserData",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "UserData"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "userInvites",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "UserInvites"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "startPool",
      "accounts": [
        {
          "name": "promiser",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "promise",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "Promise"
              },
              {
                "kind": "arg",
                "type": "string",
                "path": "promise_id"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "promiser"
              }
            ]
          }
        },
        {
          "name": "promiserData",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "UserData"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "promiser"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "promiseId",
          "type": "string"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "deadline",
          "type": "u64"
        },
        {
          "name": "promiseMessage",
          "type": "string"
        },
        {
          "name": "numVoters",
          "type": "u64"
        },
        {
          "name": "messageLen",
          "type": "u64"
        }
      ]
    },
    {
      "name": "vote",
      "accounts": [
        {
          "name": "voter",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "promiser",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "promise",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "Promise"
              },
              {
                "kind": "arg",
                "type": "string",
                "path": "promise_id"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "promiser"
              }
            ]
          }
        },
        {
          "name": "promiserData",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "UserData"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "promiser"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "promiseId",
          "type": "string"
        },
        {
          "name": "choice",
          "type": "bool"
        }
      ]
    },
    {
      "name": "timeout",
      "accounts": [
        {
          "name": "promiser",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "promise",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "Promise"
              },
              {
                "kind": "arg",
                "type": "string",
                "path": "promise_id"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "promiser"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "promiseId",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "promise",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "promiser",
            "type": "publicKey"
          },
          {
            "name": "promiseMessage",
            "type": "string"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "deadline",
            "type": "u64"
          },
          {
            "name": "votes",
            "type": {
              "vec": {
                "defined": "VoteInfo"
              }
            }
          }
        ]
      }
    },
    {
      "name": "userData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "numPromises",
            "type": "u64"
          },
          {
            "name": "numRespectedPromises",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "userInvites",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "invites",
            "type": {
              "vec": "publicKey"
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "VoteInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "voter",
            "type": "publicKey"
          },
          {
            "name": "vote",
            "type": {
              "defined": "VoteStatus"
            }
          }
        ]
      }
    },
    {
      "name": "VoteStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "NotVotedYet"
          },
          {
            "name": "Yes"
          },
          {
            "name": "No"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidVoter",
      "msg": "Invalid voter"
    },
    {
      "code": 6001,
      "name": "VoterAlreadyVoted",
      "msg": "The voter already voted"
    },
    {
      "code": 6002,
      "name": "PromiseAlreadyVoted",
      "msg": "The promise was already voted by all voters"
    },
    {
      "code": 6003,
      "name": "DeadlineNotReached",
      "msg": "The timeout slot was not reached"
    },
    {
      "code": 6004,
      "name": "DeadlineReached",
      "msg": "The timeout slot was reached"
    },
    {
      "code": 6005,
      "name": "InvalidVotersNumber",
      "msg": "The number of voters is invalid"
    },
    {
      "code": 6006,
      "name": "InvalidInvitesNumber",
      "msg": "The number of invites is invalid"
    },
    {
      "code": 6007,
      "name": "InvalidMessageLength",
      "msg": "The message length is invalid"
    },
    {
      "code": 6008,
      "name": "VoterAccountNotFound",
      "msg": "Voter account not found among remaining accounts."
    },
    {
      "code": 6009,
      "name": "InvalidInviteAccount",
      "msg": "Invalid invite account."
    }
  ]
};

export const IDL: HabitTracker = {
  "version": "0.1.0",
  "name": "habit_tracker",
  "constants": [
    {
      "name": "SEED_PROMISE",
      "type": "string",
      "value": "\"Promise\""
    },
    {
      "name": "SEED_USER_DATA",
      "type": "string",
      "value": "\"UserData\""
    },
    {
      "name": "SEED_USER_INVITE",
      "type": "string",
      "value": "\"UserInvites\""
    }
  ],
  "instructions": [
    {
      "name": "registerUser",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "promiserData",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "UserData"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "userInvites",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "UserInvites"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "startPool",
      "accounts": [
        {
          "name": "promiser",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "promise",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "Promise"
              },
              {
                "kind": "arg",
                "type": "string",
                "path": "promise_id"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "promiser"
              }
            ]
          }
        },
        {
          "name": "promiserData",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "UserData"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "promiser"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "promiseId",
          "type": "string"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "deadline",
          "type": "u64"
        },
        {
          "name": "promiseMessage",
          "type": "string"
        },
        {
          "name": "numVoters",
          "type": "u64"
        },
        {
          "name": "messageLen",
          "type": "u64"
        }
      ]
    },
    {
      "name": "vote",
      "accounts": [
        {
          "name": "voter",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "promiser",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "promise",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "Promise"
              },
              {
                "kind": "arg",
                "type": "string",
                "path": "promise_id"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "promiser"
              }
            ]
          }
        },
        {
          "name": "promiserData",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "UserData"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "promiser"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "promiseId",
          "type": "string"
        },
        {
          "name": "choice",
          "type": "bool"
        }
      ]
    },
    {
      "name": "timeout",
      "accounts": [
        {
          "name": "promiser",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "promise",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "Promise"
              },
              {
                "kind": "arg",
                "type": "string",
                "path": "promise_id"
              },
              {
                "kind": "account",
                "type": "publicKey",
                "path": "promiser"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "promiseId",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "promise",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "promiser",
            "type": "publicKey"
          },
          {
            "name": "promiseMessage",
            "type": "string"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "deadline",
            "type": "u64"
          },
          {
            "name": "votes",
            "type": {
              "vec": {
                "defined": "VoteInfo"
              }
            }
          }
        ]
      }
    },
    {
      "name": "userData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "numPromises",
            "type": "u64"
          },
          {
            "name": "numRespectedPromises",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "userInvites",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "invites",
            "type": {
              "vec": "publicKey"
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "VoteInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "voter",
            "type": "publicKey"
          },
          {
            "name": "vote",
            "type": {
              "defined": "VoteStatus"
            }
          }
        ]
      }
    },
    {
      "name": "VoteStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "NotVotedYet"
          },
          {
            "name": "Yes"
          },
          {
            "name": "No"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidVoter",
      "msg": "Invalid voter"
    },
    {
      "code": 6001,
      "name": "VoterAlreadyVoted",
      "msg": "The voter already voted"
    },
    {
      "code": 6002,
      "name": "PromiseAlreadyVoted",
      "msg": "The promise was already voted by all voters"
    },
    {
      "code": 6003,
      "name": "DeadlineNotReached",
      "msg": "The timeout slot was not reached"
    },
    {
      "code": 6004,
      "name": "DeadlineReached",
      "msg": "The timeout slot was reached"
    },
    {
      "code": 6005,
      "name": "InvalidVotersNumber",
      "msg": "The number of voters is invalid"
    },
    {
      "code": 6006,
      "name": "InvalidInvitesNumber",
      "msg": "The number of invites is invalid"
    },
    {
      "code": 6007,
      "name": "InvalidMessageLength",
      "msg": "The message length is invalid"
    },
    {
      "code": 6008,
      "name": "VoterAccountNotFound",
      "msg": "Voter account not found among remaining accounts."
    },
    {
      "code": 6009,
      "name": "InvalidInviteAccount",
      "msg": "Invalid invite account."
    }
  ]
};
