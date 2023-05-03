export * from './Proposal'
export * from './VoteAccount'
export * from './Votebank'

import { Proposal } from './Proposal'
import { Votebank } from './Votebank'
import { VoteAccount } from './VoteAccount'

export const accountProviders = { Proposal, Votebank, VoteAccount }
