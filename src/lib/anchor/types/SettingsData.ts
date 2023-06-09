/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as web3 from '@solana/web3.js'
import * as beet from '@metaplex-foundation/beet'
import * as beetSolana from '@metaplex-foundation/beet-solana'
import {
  VoteRestrictionRule,
  voteRestrictionRuleBeet,
} from './VoteRestrictionRule'
/**
 * This type is used to derive the {@link SettingsData} type as well as the de/serializer.
 * However don't refer to it in your code but use the {@link SettingsData} type instead.
 *
 * @category userTypes
 * @category enums
 * @category generated
 * @private
 */
export type SettingsDataRecord = {
  Description: { title: string; desc: string }
  OwnerInfo: { owners: web3.PublicKey[] }
  VoteRestriction: { voteRestriction: VoteRestrictionRule }
}

/**
 * Union type respresenting the SettingsData data enum defined in Rust.
 *
 * NOTE: that it includes a `__kind` property which allows to narrow types in
 * switch/if statements.
 * Additionally `isSettingsData*` type guards are exposed below to narrow to a specific variant.
 *
 * @category userTypes
 * @category enums
 * @category generated
 */
export type SettingsData = beet.DataEnumKeyAsKind<SettingsDataRecord>

export const isSettingsDataDescription = (
  x: SettingsData
): x is SettingsData & { __kind: 'Description' } => x.__kind === 'Description'
export const isSettingsDataOwnerInfo = (
  x: SettingsData
): x is SettingsData & { __kind: 'OwnerInfo' } => x.__kind === 'OwnerInfo'
export const isSettingsDataVoteRestriction = (
  x: SettingsData
): x is SettingsData & { __kind: 'VoteRestriction' } =>
  x.__kind === 'VoteRestriction'

/**
 * @category userTypes
 * @category generated
 */
export const settingsDataBeet = beet.dataEnum<SettingsDataRecord>([
  [
    'Description',
    new beet.FixableBeetArgsStruct<SettingsDataRecord['Description']>(
      [
        ['title', beet.utf8String],
        ['desc', beet.utf8String],
      ],
      'SettingsDataRecord["Description"]'
    ),
  ],

  [
    'OwnerInfo',
    new beet.FixableBeetArgsStruct<SettingsDataRecord['OwnerInfo']>(
      [['owners', beet.array(beetSolana.publicKey)]],
      'SettingsDataRecord["OwnerInfo"]'
    ),
  ],

  [
    'VoteRestriction',
    new beet.FixableBeetArgsStruct<SettingsDataRecord['VoteRestriction']>(
      [['voteRestriction', voteRestrictionRuleBeet]],
      'SettingsDataRecord["VoteRestriction"]'
    ),
  ],
]) as beet.FixableBeet<SettingsData, SettingsData>
