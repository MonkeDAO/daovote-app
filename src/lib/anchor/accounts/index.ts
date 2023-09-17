export * from './DelegateAccount'
export * from './Proposal'
export * from './VoteAccount'
export * from './Votebank'

import { DelegateAccount } from './DelegateAccount'
import { Proposal } from './Proposal'
import { Votebank } from './Votebank'
import { VoteAccount } from './VoteAccount'

export const accountProviders = {
  DelegateAccount,
  Proposal,
  Votebank,
  VoteAccount,
}
