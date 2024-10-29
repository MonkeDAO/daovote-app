export type Omcvote = {
  "version": "0.1.0",
  "name": "omcvote",
  "constants": [
    {
      "name": "DELEGATE_FEE",
      "type": "u64",
      "value": "1000"
    },
    {
      "name": "FEE_NEW_VOTEBANK",
      "type": "u64",
      "value": "100000"
    },
    {
      "name": "FEE_PROPOSAL",
      "type": "u64",
      "value": "50000"
    },
    {
      "name": "FEE_VOTE",
      "type": "u64",
      "value": "1000"
    },
    {
      "name": "PROPOSALS_GROW_CHILDREN_BY",
      "type": "u32",
      "value": "1000"
    }
  ],
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "votebank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "owners",
          "type": {
            "vec": "publicKey"
          }
        },
        {
          "name": "desc",
          "type": {
            "option": {
              "defined": "SettingsData"
            }
          }
        },
        {
          "name": "restrictions",
          "type": {
            "option": {
              "defined": "SettingsData"
            }
          }
        }
      ]
    },
    {
      "name": "initializeFeePayer",
      "accounts": [
        {
          "name": "feePayer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "votebank",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "lamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawLamports",
      "accounts": [
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feePayer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "votebank",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "returnLamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "addOwner",
      "accounts": [
        {
          "name": "votebank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "owner",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "removeOwner",
      "accounts": [
        {
          "name": "votebank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "owner",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "createProposal",
      "accounts": [
        {
          "name": "proposal",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "votebank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poster",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "options",
          "type": {
            "vec": {
              "defined": "VoteOption"
            }
          }
        },
        {
          "name": "maxOptionsSelectable",
          "type": "u8"
        },
        {
          "name": "data",
          "type": "bytes"
        },
        {
          "name": "proposalId",
          "type": "u32"
        },
        {
          "name": "settings",
          "type": {
            "vec": {
              "defined": "SettingsData"
            }
          }
        },
        {
          "name": "additionalAccountOffsets",
          "type": {
            "vec": {
              "defined": "AdditionalAccountIndices"
            }
          }
        },
        {
          "name": "endTime",
          "type": "i64"
        },
        {
          "name": "quorumThreshold",
          "type": "u32"
        }
      ]
    },
    {
      "name": "closeProposal",
      "accounts": [
        {
          "name": "proposal",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "votebank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "proposalOwner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "proposalId",
          "type": "u32"
        }
      ]
    },
    {
      "name": "cancelProposal",
      "accounts": [
        {
          "name": "proposal",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "votebank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "proposalOwner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "proposalId",
          "type": "u32"
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
          "name": "feePayer",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "votebank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "proposal",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "votes",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftVoteMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "proposalId",
          "type": "u32"
        },
        {
          "name": "voteEntries",
          "type": {
            "vec": {
              "defined": "VoteEntry"
            }
          }
        },
        {
          "name": "additionalAccountOffsets",
          "type": {
            "vec": {
              "defined": "AdditionalAccountIndices"
            }
          }
        }
      ]
    },
    {
      "name": "voteDelegation",
      "accounts": [
        {
          "name": "voter",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "feePayer",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "votebank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "proposal",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "votes",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftVoteMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "delegateAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "proposalId",
          "type": "u32"
        },
        {
          "name": "voteEntries",
          "type": {
            "vec": {
              "defined": "VoteEntry"
            }
          }
        },
        {
          "name": "additionalAccountOffsets",
          "type": {
            "vec": {
              "defined": "AdditionalAccountIndices"
            }
          }
        }
      ]
    },
    {
      "name": "createDelegate",
      "accounts": [
        {
          "name": "delegate",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "delegator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "delegateAddresses",
          "type": {
            "vec": {
              "defined": "DelegateAddress"
            }
          }
        }
      ]
    },
    {
      "name": "signDelegateAddress",
      "accounts": [
        {
          "name": "delegateAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
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
      "name": "removeDelegateAddress",
      "accounts": [
        {
          "name": "delegateAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "address",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "addDelegateAddress",
      "accounts": [
        {
          "name": "delegateAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "address",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "revokeDelegateAddress",
      "accounts": [
        {
          "name": "delegateAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "feePayer",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isInitialized",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "voteAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "votes",
            "type": {
              "vec": {
                "defined": "VoteEntry"
              }
            }
          }
        ]
      }
    },
    {
      "name": "votebank",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "maxChildId",
            "type": "u32"
          },
          {
            "name": "moderatorMint",
            "type": "publicKey"
          },
          {
            "name": "settings",
            "type": {
              "vec": {
                "defined": "SettingsData"
              }
            }
          },
          {
            "name": "openProposals",
            "type": {
              "vec": "u32"
            }
          },
          {
            "name": "closedProposals",
            "type": {
              "vec": "u32"
            }
          }
        ]
      }
    },
    {
      "name": "delegateAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "delegateOwner",
            "type": "publicKey"
          },
          {
            "name": "accounts",
            "type": {
              "vec": {
                "defined": "DelegateAddress"
              }
            }
          }
        ]
      }
    },
    {
      "name": "proposal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "poster",
            "type": "publicKey"
          },
          {
            "name": "data",
            "type": "bytes"
          },
          {
            "name": "options",
            "type": {
              "vec": {
                "defined": "VoteOption"
              }
            }
          },
          {
            "name": "maxOptionsSelectable",
            "type": "u8"
          },
          {
            "name": "settings",
            "type": {
              "vec": {
                "defined": "SettingsData"
              }
            }
          },
          {
            "name": "voterCount",
            "type": "u32"
          },
          {
            "name": "voteOpen",
            "type": "bool"
          },
          {
            "name": "proposalId",
            "type": "u32"
          },
          {
            "name": "endTime",
            "type": "i64"
          },
          {
            "name": "collectionSize",
            "type": "u32"
          },
          {
            "name": "quorumThreshold",
            "type": "u32"
          },
          {
            "name": "quorumMetTime",
            "type": "i64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "DelegateAddress",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "publicKey"
          },
          {
            "name": "signed",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "VoteOption",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "u8"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "voteCount",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "SettingsData",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Description",
            "fields": [
              {
                "name": "title",
                "type": "string"
              },
              {
                "name": "desc",
                "type": "string"
              }
            ]
          },
          {
            "name": "OwnerInfo",
            "fields": [
              {
                "name": "owners",
                "type": {
                  "vec": "publicKey"
                }
              }
            ]
          },
          {
            "name": "VoteRestriction",
            "fields": [
              {
                "name": "voteRestriction",
                "type": {
                  "defined": "VoteRestrictionRule"
                }
              }
            ]
          }
        ]
      }
    },
    {
      "name": "VoteEntry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposalId",
            "type": "u32"
          },
          {
            "name": "votedFor",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "AdditionalAccountIndices",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "TokenOwnership",
            "fields": [
              {
                "name": "tokenIdx",
                "type": "u8"
              }
            ]
          },
          {
            "name": "NftOwnership",
            "fields": [
              {
                "name": "tokenIdx",
                "type": "u8"
              },
              {
                "name": "metaIdx",
                "type": "u8"
              },
              {
                "name": "collectionIdx",
                "type": "u8"
              }
            ]
          },
          {
            "name": "Null"
          }
        ]
      }
    },
    {
      "name": "QuantifiedMint",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "VoteRestrictionRule",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "TokenOwnership",
            "fields": [
              {
                "name": "mint",
                "type": "publicKey"
              },
              {
                "name": "amount",
                "type": "u64"
              }
            ]
          },
          {
            "name": "NftOwnership",
            "fields": [
              {
                "name": "collectionId",
                "type": "publicKey"
              }
            ]
          },
          {
            "name": "Null"
          },
          {
            "name": "NftListAnyOwnership",
            "fields": [
              {
                "name": "collectionIds",
                "type": {
                  "vec": "publicKey"
                }
              }
            ]
          },
          {
            "name": "TokenOrNftAnyOwnership",
            "fields": [
              {
                "name": "mints",
                "type": {
                  "vec": {
                    "defined": "QuantifiedMint"
                  }
                }
              },
              {
                "name": "collectionIds",
                "type": {
                  "vec": "publicKey"
                }
              }
            ]
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "ProposalCancelledEvent",
      "fields": [
        {
          "name": "posterPubkey",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "votebankPubkey",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "proposalPubkey",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "proposalId",
          "type": "u32",
          "index": false
        },
        {
          "name": "cancelTime",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "ProposalClosedEvent",
      "fields": [
        {
          "name": "posterPubkey",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "votebankPubkey",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "proposalPubkey",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "proposalId",
          "type": "u32",
          "index": false
        },
        {
          "name": "voteOpen",
          "type": "bool",
          "index": false
        },
        {
          "name": "endTime",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "ProposalCreatedEvent",
      "fields": [
        {
          "name": "posterPubkey",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "votebankPubkey",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "proposalPubkey",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "proposalId",
          "type": "u32",
          "index": false
        },
        {
          "name": "data",
          "type": "bytes",
          "index": false
        },
        {
          "name": "voteOpen",
          "type": "bool",
          "index": false
        },
        {
          "name": "endTime",
          "type": "i64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "BadDescriptionSetting",
      "msg": "The description provided is not a description setting"
    },
    {
      "code": 6001,
      "name": "BadVoteRestrictionSetting",
      "msg": "The vote restriction provided is not a vote restriction setting"
    },
    {
      "code": 6100,
      "name": "ProposalIdTooLarge",
      "msg": "The provided proposal ID is too large an increase"
    },
    {
      "code": 6200,
      "name": "NotTokenAccount",
      "msg": "The provided token account is not a token account"
    },
    {
      "code": 6201,
      "name": "MissingTokenRestriction",
      "msg": "Missing the token required by the restriction"
    },
    {
      "code": 6202,
      "name": "InvalidMetadataKey",
      "msg": "Account provided is not expected metadata key"
    },
    {
      "code": 6203,
      "name": "MetadataAccountInvalid",
      "msg": "The provided account is not a metadata account"
    },
    {
      "code": 6204,
      "name": "NoCollectionOnMetadata",
      "msg": "No collection set on the metadata"
    },
    {
      "code": 6205,
      "name": "MissingCollectionNftRestriction",
      "msg": "Missing an NFT from the collection required by the restriction"
    },
    {
      "code": 6206,
      "name": "MalformedSetting",
      "msg": "Cannot parse a setting"
    },
    {
      "code": 6207,
      "name": "InvalidRestrictionExtraAccounts",
      "msg": "Extra account offsets invalid for this restriction type"
    },
    {
      "code": 6208,
      "name": "MissingRequiredOffsets",
      "msg": "Must supply offsets when a proposal restriction applies"
    },
    {
      "code": 6209,
      "name": "AlreadyVoted",
      "msg": "Already voted on this proposal"
    },
    {
      "code": 6210,
      "name": "MissingCredentials",
      "msg": "Missing a required credential for proposal restriction"
    },
    {
      "code": 6211,
      "name": "MultipleProposalIds",
      "msg": "Cannot vote on a proposal with different proposal ids"
    },
    {
      "code": 6212,
      "name": "MultipleSameVotedFor",
      "msg": "Cannot vote on an option more than once"
    },
    {
      "code": 6213,
      "name": "TooManyEntriesSelected",
      "msg": "Cannot vote for more than max allowed"
    },
    {
      "code": 6214,
      "name": "MissingSigner",
      "msg": "There must be a signer present for this instruction"
    },
    {
      "code": 6215,
      "name": "DuplicateVoteOptionIds",
      "msg": "Vote option IDs must be unique"
    },
    {
      "code": 6216,
      "name": "ProposalClosed",
      "msg": "Proposal is closed for voting"
    },
    {
      "code": 6217,
      "name": "ProposalCannotBeClosed",
      "msg": "Cannot close proposal for voting"
    },
    {
      "code": 6218,
      "name": "NotProposalOwner",
      "msg": "Cannot cancel proposal that is not the original creator"
    },
    {
      "code": 6219,
      "name": "NotVotebankOwner",
      "msg": "Not a votebank owner"
    },
    {
      "code": 6220,
      "name": "OwnerAlreadyExists",
      "msg": "Already owner of the votebank"
    },
    {
      "code": 6221,
      "name": "OwnerNotFound",
      "msg": "Owner on votebank does not exist"
    },
    {
      "code": 6222,
      "name": "LastOwnerCannotBeRemoved",
      "msg": "There needs to be at least one owner"
    },
    {
      "code": 6223,
      "name": "TooManyDelegateAddresses",
      "msg": "You can only delegate 5 addresses"
    },
    {
      "code": 6224,
      "name": "DelegateAddressNotFound",
      "msg": "Signer not found in delegate addresses"
    },
    {
      "code": 6225,
      "name": "DuplicateDelegateAddresses",
      "msg": "Duplicate delegate addresses found"
    },
    {
      "code": 6226,
      "name": "DelegateAddressAlreadySigned",
      "msg": "Delegate address cannot be signed on creation"
    },
    {
      "code": 6227,
      "name": "CannotAddSelfAsDelegate",
      "msg": "Cannot add self as delegate"
    },
    {
      "code": 6228,
      "name": "VoteCountMustBeZero",
      "msg": "Vote count must be zero"
    },
    {
      "code": 6229,
      "name": "FeePayerAlreadyInitialized",
      "msg": "Fee payer is already initialized"
    },
    {
      "code": 6230,
      "name": "FeePayerNotInitialized",
      "msg": "Fee payer is not initialized"
    }
  ]
};

export const IDL: Omcvote = {
  "version": "0.1.0",
  "name": "omcvote",
  "constants": [
    {
      "name": "DELEGATE_FEE",
      "type": "u64",
      "value": "1000"
    },
    {
      "name": "FEE_NEW_VOTEBANK",
      "type": "u64",
      "value": "100000"
    },
    {
      "name": "FEE_PROPOSAL",
      "type": "u64",
      "value": "50000"
    },
    {
      "name": "FEE_VOTE",
      "type": "u64",
      "value": "1000"
    },
    {
      "name": "PROPOSALS_GROW_CHILDREN_BY",
      "type": "u32",
      "value": "1000"
    }
  ],
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "votebank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "owners",
          "type": {
            "vec": "publicKey"
          }
        },
        {
          "name": "desc",
          "type": {
            "option": {
              "defined": "SettingsData"
            }
          }
        },
        {
          "name": "restrictions",
          "type": {
            "option": {
              "defined": "SettingsData"
            }
          }
        }
      ]
    },
    {
      "name": "initializeFeePayer",
      "accounts": [
        {
          "name": "feePayer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "votebank",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "lamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawLamports",
      "accounts": [
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feePayer",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "votebank",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "returnLamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "addOwner",
      "accounts": [
        {
          "name": "votebank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "owner",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "removeOwner",
      "accounts": [
        {
          "name": "votebank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "owner",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "createProposal",
      "accounts": [
        {
          "name": "proposal",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "votebank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poster",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "options",
          "type": {
            "vec": {
              "defined": "VoteOption"
            }
          }
        },
        {
          "name": "maxOptionsSelectable",
          "type": "u8"
        },
        {
          "name": "data",
          "type": "bytes"
        },
        {
          "name": "proposalId",
          "type": "u32"
        },
        {
          "name": "settings",
          "type": {
            "vec": {
              "defined": "SettingsData"
            }
          }
        },
        {
          "name": "additionalAccountOffsets",
          "type": {
            "vec": {
              "defined": "AdditionalAccountIndices"
            }
          }
        },
        {
          "name": "endTime",
          "type": "i64"
        },
        {
          "name": "quorumThreshold",
          "type": "u32"
        }
      ]
    },
    {
      "name": "closeProposal",
      "accounts": [
        {
          "name": "proposal",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "votebank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "proposalOwner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "proposalId",
          "type": "u32"
        }
      ]
    },
    {
      "name": "cancelProposal",
      "accounts": [
        {
          "name": "proposal",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "votebank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "proposalOwner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "proposalId",
          "type": "u32"
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
          "name": "feePayer",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "votebank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "proposal",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "votes",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftVoteMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "proposalId",
          "type": "u32"
        },
        {
          "name": "voteEntries",
          "type": {
            "vec": {
              "defined": "VoteEntry"
            }
          }
        },
        {
          "name": "additionalAccountOffsets",
          "type": {
            "vec": {
              "defined": "AdditionalAccountIndices"
            }
          }
        }
      ]
    },
    {
      "name": "voteDelegation",
      "accounts": [
        {
          "name": "voter",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "feePayer",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "votebank",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "proposal",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "votes",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftVoteMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "delegateAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "proposalId",
          "type": "u32"
        },
        {
          "name": "voteEntries",
          "type": {
            "vec": {
              "defined": "VoteEntry"
            }
          }
        },
        {
          "name": "additionalAccountOffsets",
          "type": {
            "vec": {
              "defined": "AdditionalAccountIndices"
            }
          }
        }
      ]
    },
    {
      "name": "createDelegate",
      "accounts": [
        {
          "name": "delegate",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "delegator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "delegateAddresses",
          "type": {
            "vec": {
              "defined": "DelegateAddress"
            }
          }
        }
      ]
    },
    {
      "name": "signDelegateAddress",
      "accounts": [
        {
          "name": "delegateAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
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
      "name": "removeDelegateAddress",
      "accounts": [
        {
          "name": "delegateAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "address",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "addDelegateAddress",
      "accounts": [
        {
          "name": "delegateAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "treasury",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "address",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "revokeDelegateAddress",
      "accounts": [
        {
          "name": "delegateAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "feePayer",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isInitialized",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "voteAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "votes",
            "type": {
              "vec": {
                "defined": "VoteEntry"
              }
            }
          }
        ]
      }
    },
    {
      "name": "votebank",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "maxChildId",
            "type": "u32"
          },
          {
            "name": "moderatorMint",
            "type": "publicKey"
          },
          {
            "name": "settings",
            "type": {
              "vec": {
                "defined": "SettingsData"
              }
            }
          },
          {
            "name": "openProposals",
            "type": {
              "vec": "u32"
            }
          },
          {
            "name": "closedProposals",
            "type": {
              "vec": "u32"
            }
          }
        ]
      }
    },
    {
      "name": "delegateAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "delegateOwner",
            "type": "publicKey"
          },
          {
            "name": "accounts",
            "type": {
              "vec": {
                "defined": "DelegateAddress"
              }
            }
          }
        ]
      }
    },
    {
      "name": "proposal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "poster",
            "type": "publicKey"
          },
          {
            "name": "data",
            "type": "bytes"
          },
          {
            "name": "options",
            "type": {
              "vec": {
                "defined": "VoteOption"
              }
            }
          },
          {
            "name": "maxOptionsSelectable",
            "type": "u8"
          },
          {
            "name": "settings",
            "type": {
              "vec": {
                "defined": "SettingsData"
              }
            }
          },
          {
            "name": "voterCount",
            "type": "u32"
          },
          {
            "name": "voteOpen",
            "type": "bool"
          },
          {
            "name": "proposalId",
            "type": "u32"
          },
          {
            "name": "endTime",
            "type": "i64"
          },
          {
            "name": "collectionSize",
            "type": "u32"
          },
          {
            "name": "quorumThreshold",
            "type": "u32"
          },
          {
            "name": "quorumMetTime",
            "type": "i64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "DelegateAddress",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "publicKey"
          },
          {
            "name": "signed",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "VoteOption",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "u8"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "voteCount",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "SettingsData",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Description",
            "fields": [
              {
                "name": "title",
                "type": "string"
              },
              {
                "name": "desc",
                "type": "string"
              }
            ]
          },
          {
            "name": "OwnerInfo",
            "fields": [
              {
                "name": "owners",
                "type": {
                  "vec": "publicKey"
                }
              }
            ]
          },
          {
            "name": "VoteRestriction",
            "fields": [
              {
                "name": "voteRestriction",
                "type": {
                  "defined": "VoteRestrictionRule"
                }
              }
            ]
          }
        ]
      }
    },
    {
      "name": "VoteEntry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposalId",
            "type": "u32"
          },
          {
            "name": "votedFor",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "AdditionalAccountIndices",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "TokenOwnership",
            "fields": [
              {
                "name": "tokenIdx",
                "type": "u8"
              }
            ]
          },
          {
            "name": "NftOwnership",
            "fields": [
              {
                "name": "tokenIdx",
                "type": "u8"
              },
              {
                "name": "metaIdx",
                "type": "u8"
              },
              {
                "name": "collectionIdx",
                "type": "u8"
              }
            ]
          },
          {
            "name": "Null"
          }
        ]
      }
    },
    {
      "name": "QuantifiedMint",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "VoteRestrictionRule",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "TokenOwnership",
            "fields": [
              {
                "name": "mint",
                "type": "publicKey"
              },
              {
                "name": "amount",
                "type": "u64"
              }
            ]
          },
          {
            "name": "NftOwnership",
            "fields": [
              {
                "name": "collectionId",
                "type": "publicKey"
              }
            ]
          },
          {
            "name": "Null"
          },
          {
            "name": "NftListAnyOwnership",
            "fields": [
              {
                "name": "collectionIds",
                "type": {
                  "vec": "publicKey"
                }
              }
            ]
          },
          {
            "name": "TokenOrNftAnyOwnership",
            "fields": [
              {
                "name": "mints",
                "type": {
                  "vec": {
                    "defined": "QuantifiedMint"
                  }
                }
              },
              {
                "name": "collectionIds",
                "type": {
                  "vec": "publicKey"
                }
              }
            ]
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "ProposalCancelledEvent",
      "fields": [
        {
          "name": "posterPubkey",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "votebankPubkey",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "proposalPubkey",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "proposalId",
          "type": "u32",
          "index": false
        },
        {
          "name": "cancelTime",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "ProposalClosedEvent",
      "fields": [
        {
          "name": "posterPubkey",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "votebankPubkey",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "proposalPubkey",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "proposalId",
          "type": "u32",
          "index": false
        },
        {
          "name": "voteOpen",
          "type": "bool",
          "index": false
        },
        {
          "name": "endTime",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "ProposalCreatedEvent",
      "fields": [
        {
          "name": "posterPubkey",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "votebankPubkey",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "proposalPubkey",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "proposalId",
          "type": "u32",
          "index": false
        },
        {
          "name": "data",
          "type": "bytes",
          "index": false
        },
        {
          "name": "voteOpen",
          "type": "bool",
          "index": false
        },
        {
          "name": "endTime",
          "type": "i64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "BadDescriptionSetting",
      "msg": "The description provided is not a description setting"
    },
    {
      "code": 6001,
      "name": "BadVoteRestrictionSetting",
      "msg": "The vote restriction provided is not a vote restriction setting"
    },
    {
      "code": 6100,
      "name": "ProposalIdTooLarge",
      "msg": "The provided proposal ID is too large an increase"
    },
    {
      "code": 6200,
      "name": "NotTokenAccount",
      "msg": "The provided token account is not a token account"
    },
    {
      "code": 6201,
      "name": "MissingTokenRestriction",
      "msg": "Missing the token required by the restriction"
    },
    {
      "code": 6202,
      "name": "InvalidMetadataKey",
      "msg": "Account provided is not expected metadata key"
    },
    {
      "code": 6203,
      "name": "MetadataAccountInvalid",
      "msg": "The provided account is not a metadata account"
    },
    {
      "code": 6204,
      "name": "NoCollectionOnMetadata",
      "msg": "No collection set on the metadata"
    },
    {
      "code": 6205,
      "name": "MissingCollectionNftRestriction",
      "msg": "Missing an NFT from the collection required by the restriction"
    },
    {
      "code": 6206,
      "name": "MalformedSetting",
      "msg": "Cannot parse a setting"
    },
    {
      "code": 6207,
      "name": "InvalidRestrictionExtraAccounts",
      "msg": "Extra account offsets invalid for this restriction type"
    },
    {
      "code": 6208,
      "name": "MissingRequiredOffsets",
      "msg": "Must supply offsets when a proposal restriction applies"
    },
    {
      "code": 6209,
      "name": "AlreadyVoted",
      "msg": "Already voted on this proposal"
    },
    {
      "code": 6210,
      "name": "MissingCredentials",
      "msg": "Missing a required credential for proposal restriction"
    },
    {
      "code": 6211,
      "name": "MultipleProposalIds",
      "msg": "Cannot vote on a proposal with different proposal ids"
    },
    {
      "code": 6212,
      "name": "MultipleSameVotedFor",
      "msg": "Cannot vote on an option more than once"
    },
    {
      "code": 6213,
      "name": "TooManyEntriesSelected",
      "msg": "Cannot vote for more than max allowed"
    },
    {
      "code": 6214,
      "name": "MissingSigner",
      "msg": "There must be a signer present for this instruction"
    },
    {
      "code": 6215,
      "name": "DuplicateVoteOptionIds",
      "msg": "Vote option IDs must be unique"
    },
    {
      "code": 6216,
      "name": "ProposalClosed",
      "msg": "Proposal is closed for voting"
    },
    {
      "code": 6217,
      "name": "ProposalCannotBeClosed",
      "msg": "Cannot close proposal for voting"
    },
    {
      "code": 6218,
      "name": "NotProposalOwner",
      "msg": "Cannot cancel proposal that is not the original creator"
    },
    {
      "code": 6219,
      "name": "NotVotebankOwner",
      "msg": "Not a votebank owner"
    },
    {
      "code": 6220,
      "name": "OwnerAlreadyExists",
      "msg": "Already owner of the votebank"
    },
    {
      "code": 6221,
      "name": "OwnerNotFound",
      "msg": "Owner on votebank does not exist"
    },
    {
      "code": 6222,
      "name": "LastOwnerCannotBeRemoved",
      "msg": "There needs to be at least one owner"
    },
    {
      "code": 6223,
      "name": "TooManyDelegateAddresses",
      "msg": "You can only delegate 5 addresses"
    },
    {
      "code": 6224,
      "name": "DelegateAddressNotFound",
      "msg": "Signer not found in delegate addresses"
    },
    {
      "code": 6225,
      "name": "DuplicateDelegateAddresses",
      "msg": "Duplicate delegate addresses found"
    },
    {
      "code": 6226,
      "name": "DelegateAddressAlreadySigned",
      "msg": "Delegate address cannot be signed on creation"
    },
    {
      "code": 6227,
      "name": "CannotAddSelfAsDelegate",
      "msg": "Cannot add self as delegate"
    },
    {
      "code": 6228,
      "name": "VoteCountMustBeZero",
      "msg": "Vote count must be zero"
    },
    {
      "code": 6229,
      "name": "FeePayerAlreadyInitialized",
      "msg": "Fee payer is already initialized"
    },
    {
      "code": 6230,
      "name": "FeePayerNotInitialized",
      "msg": "Fee payer is not initialized"
    }
  ]
};
