/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'

/**
 * @category Instructions
 * @category CloseProposal
 * @category generated
 */
export type CloseProposalInstructionArgs = {
  proposalId: number
}
/**
 * @category Instructions
 * @category CloseProposal
 * @category generated
 */
export const closeProposalStruct = new beet.BeetArgsStruct<
  CloseProposalInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['proposalId', beet.u32],
  ],
  'CloseProposalInstructionArgs'
)
/**
 * Accounts required by the _closeProposal_ instruction
 *
 * @property [_writable_] proposal
 * @property [_writable_] votebank
 * @property [**signer**] proposalOwner
 * @category Instructions
 * @category CloseProposal
 * @category generated
 */
export type CloseProposalInstructionAccounts = {
  proposal: web3.PublicKey
  votebank: web3.PublicKey
  proposalOwner: web3.PublicKey
  systemProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const closeProposalInstructionDiscriminator = [
  213, 178, 139, 19, 50, 191, 82, 245,
]

/**
 * Creates a _CloseProposal_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category CloseProposal
 * @category generated
 */
export function createCloseProposalInstruction(
  accounts: CloseProposalInstructionAccounts,
  args: CloseProposalInstructionArgs,
  programId = new web3.PublicKey('mdVo394XANGMrVXZCVAaX3AMHYvtTxXwg1sQmDSY1W1')
) {
  const [data] = closeProposalStruct.serialize({
    instructionDiscriminator: closeProposalInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.proposal,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.votebank,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.proposalOwner,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: accounts.systemProgram ?? web3.SystemProgram.programId,
      isWritable: false,
      isSigner: false,
    },
  ]

  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc)
    }
  }

  const ix = new web3.TransactionInstruction({
    programId,
    keys,
    data,
  })
  return ix
}
