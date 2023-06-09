/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as web3 from '@solana/web3.js'
import * as beet from '@metaplex-foundation/beet'
import * as beetSolana from '@metaplex-foundation/beet-solana'
import { QuantifiedMint, quantifiedMintBeet } from './QuantifiedMint'
/**
 * This type is used to derive the {@link VoteRestrictionRule} type as well as the de/serializer.
 * However don't refer to it in your code but use the {@link VoteRestrictionRule} type instead.
 *
 * @category userTypes
 * @category enums
 * @category generated
 * @private
 */
export type VoteRestrictionRuleRecord = {
  TokenOwnership: { mint: web3.PublicKey; amount: beet.bignum }
  NftOwnership: { collectionId: web3.PublicKey }
  Null: void /* scalar variant */
  NftListAnyOwnership: { collectionIds: web3.PublicKey[] }
  TokenOrNftAnyOwnership: {
    mints: QuantifiedMint[]
    collectionIds: web3.PublicKey[]
  }
}

/**
 * Union type respresenting the VoteRestrictionRule data enum defined in Rust.
 *
 * NOTE: that it includes a `__kind` property which allows to narrow types in
 * switch/if statements.
 * Additionally `isVoteRestrictionRule*` type guards are exposed below to narrow to a specific variant.
 *
 * @category userTypes
 * @category enums
 * @category generated
 */
export type VoteRestrictionRule =
  beet.DataEnumKeyAsKind<VoteRestrictionRuleRecord>

export const isVoteRestrictionRuleTokenOwnership = (
  x: VoteRestrictionRule
): x is VoteRestrictionRule & { __kind: 'TokenOwnership' } =>
  x.__kind === 'TokenOwnership'
export const isVoteRestrictionRuleNftOwnership = (
  x: VoteRestrictionRule
): x is VoteRestrictionRule & { __kind: 'NftOwnership' } =>
  x.__kind === 'NftOwnership'
export const isVoteRestrictionRuleNull = (
  x: VoteRestrictionRule
): x is VoteRestrictionRule & { __kind: 'Null' } => x.__kind === 'Null'
export const isVoteRestrictionRuleNftListAnyOwnership = (
  x: VoteRestrictionRule
): x is VoteRestrictionRule & { __kind: 'NftListAnyOwnership' } =>
  x.__kind === 'NftListAnyOwnership'
export const isVoteRestrictionRuleTokenOrNftAnyOwnership = (
  x: VoteRestrictionRule
): x is VoteRestrictionRule & { __kind: 'TokenOrNftAnyOwnership' } =>
  x.__kind === 'TokenOrNftAnyOwnership'

/**
 * @category userTypes
 * @category generated
 */
export const voteRestrictionRuleBeet = beet.dataEnum<VoteRestrictionRuleRecord>(
  [
    [
      'TokenOwnership',
      new beet.BeetArgsStruct<VoteRestrictionRuleRecord['TokenOwnership']>(
        [
          ['mint', beetSolana.publicKey],
          ['amount', beet.u64],
        ],
        'VoteRestrictionRuleRecord["TokenOwnership"]'
      ),
    ],

    [
      'NftOwnership',
      new beet.BeetArgsStruct<VoteRestrictionRuleRecord['NftOwnership']>(
        [['collectionId', beetSolana.publicKey]],
        'VoteRestrictionRuleRecord["NftOwnership"]'
      ),
    ],
    ['Null', beet.unit],

    [
      'NftListAnyOwnership',
      new beet.FixableBeetArgsStruct<
        VoteRestrictionRuleRecord['NftListAnyOwnership']
      >(
        [['collectionIds', beet.array(beetSolana.publicKey)]],
        'VoteRestrictionRuleRecord["NftListAnyOwnership"]'
      ),
    ],

    [
      'TokenOrNftAnyOwnership',
      new beet.FixableBeetArgsStruct<
        VoteRestrictionRuleRecord['TokenOrNftAnyOwnership']
      >(
        [
          ['mints', beet.array(quantifiedMintBeet)],
          ['collectionIds', beet.array(beetSolana.publicKey)],
        ],
        'VoteRestrictionRuleRecord["TokenOrNftAnyOwnership"]'
      ),
    ],
  ]
) as beet.FixableBeet<VoteRestrictionRule, VoteRestrictionRule>
