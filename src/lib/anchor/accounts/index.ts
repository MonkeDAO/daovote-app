export * from './DelegateAccount'
export * from './FeePayer'
export * from './Proposal'
export * from './VoteAccount'
export * from './Votebank'

import { FeePayer } from './FeePayer'
import { VoteAccount } from './VoteAccount'
import { Votebank } from './Votebank'
import { DelegateAccount } from './DelegateAccount'
import { Proposal } from './Proposal'

export const accountProviders = {
  FeePayer,
  VoteAccount,
  Votebank,
  DelegateAccount,
  Proposal,
}
