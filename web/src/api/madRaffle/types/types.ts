import { PublicKey } from "@solana/web3.js";

export type MadRaffle = {
  "version": "0.1.0",
  "name": "mad_raffle",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "tracker",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "superVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "raffle",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
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
      "name": "buyTicket",
      "accounts": [
        {
          "name": "raffle",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "feeVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tracker",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "superVault",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "endRaffle",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "src",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "dest",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "edition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ownerTokenRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destTokenRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pnftShared",
          "accounts": [
            {
              "name": "tokenMetadataProgram",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "instructions",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "authorizationRulesProgram",
              "isMut": false,
              "isSigner": false
            }
          ]
        },
        {
          "name": "raffle",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newRaffle",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tracker",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creator1",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "creator2",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "creator3",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "creator4",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "creator5",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        }
      ],
      "args": [
        {
          "name": "authorizationData",
          "type": {
            "option": {
              "defined": "AuthorizationDataLocal"
            }
          }
        },
        {
          "name": "rulesAccPresent",
          "type": "bool"
        }
      ]
    },
    {
      "name": "selectWinner",
      "accounts": [
        {
          "name": "raffle",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "random",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Unchecked random address using Keypair.generate().pubkey()"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "raffleId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "distributePrize",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "winner",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "src",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "dest",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "edition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ownerTokenRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destTokenRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pnftShared",
          "accounts": [
            {
              "name": "tokenMetadataProgram",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "instructions",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "authorizationRulesProgram",
              "isMut": false,
              "isSigner": false
            }
          ]
        },
        {
          "name": "raffle",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "raffleId",
          "type": "u64"
        },
        {
          "name": "authorizationData",
          "type": {
            "option": {
              "defined": "AuthorizationDataLocal"
            }
          }
        },
        {
          "name": "rulesAccPresent",
          "type": "bool"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "raffle",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "active",
            "type": "bool"
          },
          {
            "name": "tickets",
            "type": {
              "vec": {
                "defined": "TicketHolder"
              }
            }
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "endTime",
            "type": "i64"
          },
          {
            "name": "prize",
            "type": {
              "option": {
                "defined": "Prize"
              }
            }
          },
          {
            "name": "winner",
            "type": {
              "option": "publicKey"
            }
          }
        ]
      }
    },
    {
      "name": "raffleTracker",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "currentRaffle",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "scoreboard",
            "type": {
              "vec": {
                "defined": "UserPoints"
              }
            }
          }
        ]
      }
    },
    {
      "name": "superVault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "Prize",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "ata",
            "type": "publicKey"
          },
          {
            "name": "sent",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "TicketHolder",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "publicKey"
          },
          {
            "name": "qty",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "UserPoints",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "publicKey"
          },
          {
            "name": "points",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "AuthorizationDataLocal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "payload",
            "type": {
              "vec": {
                "defined": "TaggedPayload"
              }
            }
          }
        ]
      }
    },
    {
      "name": "TaggedPayload",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "payload",
            "type": {
              "defined": "PayloadTypeLocal"
            }
          }
        ]
      }
    },
    {
      "name": "SeedsVecLocal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "seeds",
            "docs": [
              "The vector of derivation seeds."
            ],
            "type": {
              "vec": "bytes"
            }
          }
        ]
      }
    },
    {
      "name": "ProofInfoLocal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proof",
            "docs": [
              "The merkle proof."
            ],
            "type": {
              "vec": {
                "array": [
                  "u8",
                  32
                ]
              }
            }
          }
        ]
      }
    },
    {
      "name": "PnftError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "BadMetadata"
          },
          {
            "name": "BadRuleset"
          },
          {
            "name": "InvalidCollectionAddress"
          },
          {
            "name": "NotVerifiedByCollection"
          }
        ]
      }
    },
    {
      "name": "PrizeError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "InvalidPrizeMint"
          },
          {
            "name": "InvalidWinner"
          },
          {
            "name": "NoPrizeInRaffle"
          },
          {
            "name": "UnauthorizedDistributor"
          }
        ]
      }
    },
    {
      "name": "PayloadTypeLocal",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Pubkey",
            "fields": [
              "publicKey"
            ]
          },
          {
            "name": "Seeds",
            "fields": [
              {
                "defined": "SeedsVecLocal"
              }
            ]
          },
          {
            "name": "MerkleProof",
            "fields": [
              {
                "defined": "ProofInfoLocal"
              }
            ]
          },
          {
            "name": "Number",
            "fields": [
              "u64"
            ]
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "NotActive",
      "msg": "Selected raffle is not active"
    },
    {
      "code": 6001,
      "name": "StillActive",
      "msg": "Selected raffle is still active"
    },
    {
      "code": 6002,
      "name": "InvalidVault",
      "msg": "Invalid vault account"
    },
    {
      "code": 6003,
      "name": "RaffleClosed",
      "msg": "Raffle has already closed"
    },
    {
      "code": 6004,
      "name": "MaxTicketsPerUserExceeded",
      "msg": "Max tickets per user exceeded"
    },
    {
      "code": 6005,
      "name": "RaffleAlreadyActive",
      "msg": "Raffle is already active"
    },
    {
      "code": 6006,
      "name": "NoTickets",
      "msg": "No Raffle Tickets Sold"
    },
    {
      "code": 6007,
      "name": "NoWinner",
      "msg": "Error Selecting Winner"
    },
    {
      "code": 6008,
      "name": "UnauthorizedSigner",
      "msg": "UNAUTHORIZED"
    },
    {
      "code": 6009,
      "name": "WinnerAlreadySelected",
      "msg": "Winner already selected"
    },
    {
      "code": 6010,
      "name": "WinnerNotSelected",
      "msg": "Winner not yet selected"
    },
    {
      "code": 6011,
      "name": "RafflePdaMismatch",
      "msg": "Raffle PDA does not match ID"
    }
  ]
};

export const IDL: MadRaffle = {
  "version": "0.1.0",
  "name": "mad_raffle",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "tracker",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "superVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "raffle",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
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
      "name": "buyTicket",
      "accounts": [
        {
          "name": "raffle",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "feeVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tracker",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "superVault",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "endRaffle",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "src",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "dest",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "edition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ownerTokenRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destTokenRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pnftShared",
          "accounts": [
            {
              "name": "tokenMetadataProgram",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "instructions",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "authorizationRulesProgram",
              "isMut": false,
              "isSigner": false
            }
          ]
        },
        {
          "name": "raffle",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newRaffle",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tracker",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creator1",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "creator2",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "creator3",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "creator4",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "creator5",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        }
      ],
      "args": [
        {
          "name": "authorizationData",
          "type": {
            "option": {
              "defined": "AuthorizationDataLocal"
            }
          }
        },
        {
          "name": "rulesAccPresent",
          "type": "bool"
        }
      ]
    },
    {
      "name": "selectWinner",
      "accounts": [
        {
          "name": "raffle",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "random",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Unchecked random address using Keypair.generate().pubkey()"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "raffleId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "distributePrize",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "winner",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "src",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "dest",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "edition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ownerTokenRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "destTokenRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pnftShared",
          "accounts": [
            {
              "name": "tokenMetadataProgram",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "instructions",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "authorizationRulesProgram",
              "isMut": false,
              "isSigner": false
            }
          ]
        },
        {
          "name": "raffle",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "raffleId",
          "type": "u64"
        },
        {
          "name": "authorizationData",
          "type": {
            "option": {
              "defined": "AuthorizationDataLocal"
            }
          }
        },
        {
          "name": "rulesAccPresent",
          "type": "bool"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "raffle",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "active",
            "type": "bool"
          },
          {
            "name": "tickets",
            "type": {
              "vec": {
                "defined": "TicketHolder"
              }
            }
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "endTime",
            "type": "i64"
          },
          {
            "name": "prize",
            "type": {
              "option": {
                "defined": "Prize"
              }
            }
          },
          {
            "name": "winner",
            "type": {
              "option": "publicKey"
            }
          }
        ]
      }
    },
    {
      "name": "raffleTracker",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "currentRaffle",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "scoreboard",
            "type": {
              "vec": {
                "defined": "UserPoints"
              }
            }
          }
        ]
      }
    },
    {
      "name": "superVault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "Prize",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "ata",
            "type": "publicKey"
          },
          {
            "name": "sent",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "TicketHolder",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "publicKey"
          },
          {
            "name": "qty",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "UserPoints",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "publicKey"
          },
          {
            "name": "points",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "AuthorizationDataLocal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "payload",
            "type": {
              "vec": {
                "defined": "TaggedPayload"
              }
            }
          }
        ]
      }
    },
    {
      "name": "TaggedPayload",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "payload",
            "type": {
              "defined": "PayloadTypeLocal"
            }
          }
        ]
      }
    },
    {
      "name": "SeedsVecLocal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "seeds",
            "docs": [
              "The vector of derivation seeds."
            ],
            "type": {
              "vec": "bytes"
            }
          }
        ]
      }
    },
    {
      "name": "ProofInfoLocal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proof",
            "docs": [
              "The merkle proof."
            ],
            "type": {
              "vec": {
                "array": [
                  "u8",
                  32
                ]
              }
            }
          }
        ]
      }
    },
    {
      "name": "PnftError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "BadMetadata"
          },
          {
            "name": "BadRuleset"
          },
          {
            "name": "InvalidCollectionAddress"
          },
          {
            "name": "NotVerifiedByCollection"
          }
        ]
      }
    },
    {
      "name": "PrizeError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "InvalidPrizeMint"
          },
          {
            "name": "InvalidWinner"
          },
          {
            "name": "NoPrizeInRaffle"
          },
          {
            "name": "UnauthorizedDistributor"
          }
        ]
      }
    },
    {
      "name": "PayloadTypeLocal",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Pubkey",
            "fields": [
              "publicKey"
            ]
          },
          {
            "name": "Seeds",
            "fields": [
              {
                "defined": "SeedsVecLocal"
              }
            ]
          },
          {
            "name": "MerkleProof",
            "fields": [
              {
                "defined": "ProofInfoLocal"
              }
            ]
          },
          {
            "name": "Number",
            "fields": [
              "u64"
            ]
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "NotActive",
      "msg": "Selected raffle is not active"
    },
    {
      "code": 6001,
      "name": "StillActive",
      "msg": "Selected raffle is still active"
    },
    {
      "code": 6002,
      "name": "InvalidVault",
      "msg": "Invalid vault account"
    },
    {
      "code": 6003,
      "name": "RaffleClosed",
      "msg": "Raffle has already closed"
    },
    {
      "code": 6004,
      "name": "MaxTicketsPerUserExceeded",
      "msg": "Max tickets per user exceeded"
    },
    {
      "code": 6005,
      "name": "RaffleAlreadyActive",
      "msg": "Raffle is already active"
    },
    {
      "code": 6006,
      "name": "NoTickets",
      "msg": "No Raffle Tickets Sold"
    },
    {
      "code": 6007,
      "name": "NoWinner",
      "msg": "Error Selecting Winner"
    },
    {
      "code": 6008,
      "name": "UnauthorizedSigner",
      "msg": "UNAUTHORIZED"
    },
    {
      "code": 6009,
      "name": "WinnerAlreadySelected",
      "msg": "Winner already selected"
    },
    {
      "code": 6010,
      "name": "WinnerNotSelected",
      "msg": "Winner not yet selected"
    },
    {
      "code": 6011,
      "name": "RafflePdaMismatch",
      "msg": "Raffle PDA does not match ID"
    }
  ]
};

export interface ScoreboardEntry {
  user: PublicKey;
  points: number;
}

export interface Raffle {
  id: number;
  version: number;
  bump: number;
  active: boolean;
  tickets: TicketHolder[];
  startTime: number;
  endTime: number;
  prize?: Prize;
  winner?: PublicKey;
  availableLamports: number;
}

export interface TicketHolder {
  user: PublicKey;
  qty: number;
}

export interface Prize {
  mint: PublicKey;
  ata: PublicKey;
  sent: boolean;
}
