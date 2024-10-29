/* eslint-disable no-unused-vars */
import { PUBLIC_VOTE_PROGRAM, PUBLIC_ENABLE_FEE_PAYER } from '$env/static/public';
import { VoteAccount, Votebank } from '$lib/anchor/accounts';
import {
	createVoteDelegationInstruction,
	createVoteInstruction,
	type VoteInstructionAccounts,
	type VoteInstructionArgs
} from '$lib/anchor/instructions';
import type { NftMetadata, ProposalItem } from '$lib/types';
import { PublicKey } from '@metaplex-foundation/js';
import { web3 } from '@project-serum/anchor';
import type { Connection, TransactionInstruction } from '@solana/web3.js';
import {
	TREASURY_ADDRESS,
	delegateAccountPda,
	extractRestrictionData,
	feePayerPda,
	fetchProposalById,
	getDefaultPublicKey,
	getDelegateAccountType,
	proposalAccountPda,
	toAccountMetadata,
	voteAccountPda
} from './solana';
import type { SettingsData, VoteEntry } from '$lib/anchor/types';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import type { AdditionalAccountIndices } from '../anchor/types/AdditionalAccountIndices';
import type { VoteDelegationInstructionAccounts, VoteDelegationInstructionArgs } from '../anchor/instructions/voteDelegation';


export async function buildNftVoteIx(
	connection: Connection,
	voter: PublicKey,
	votebank: PublicKey,
	voteEntries: VoteEntry[],
	proposalId: number,
	nft: NftMetadata,
	proposalItem?: ProposalItem,
	programId: PublicKey = new PublicKey(PUBLIC_VOTE_PROGRAM)
): Promise<TransactionInstruction | null> {
	const votebankAccount = await Votebank.fromAccountAddress(connection, votebank);
	const [delegateAccountAddress] = delegateAccountPda(voter, programId);
	const delegateAccount = await getDelegateAccountType(voter, connection);

	let proposal: ProposalItem | null;
	if (!proposalItem) {
		proposal = await fetchProposalById(connection, votebank, proposalId);
	} else {
		proposal = proposalItem;
	}
	if (!proposal) {
		return null;
	}
	const {
		restrictionMint: proposalRestrictionMint,
		isNftRestricted: proposalIsNftRestricted,
		restrictionIx: proposalRestrictionIx,
		ruleKind: proposalRulekind
	} = extractRestrictionData(proposal.settings);
	const votebankSettings = votebankAccount.settings as SettingsData[];
	const { restrictionMint, isNftRestricted, restrictionIx, ruleKind } =
		extractRestrictionData(votebankSettings);
	let mint = getDefaultPublicKey();
	let nftMintMetadata = getDefaultPublicKey();
	let tokenAccount = getDefaultPublicKey();
	let additionalAccountOffsets: AdditionalAccountIndices[] = [
		{
			__kind: 'Null'
		}
	];

	if (isNftRestricted) {
		// Find by collection id:
		if (nft.collection && nft.collection.address === restrictionMint.toBase58()) {
			mint = new PublicKey(nft.address);
			nftMintMetadata = new PublicKey(nft.metadataAddress);
		}
		tokenAccount = await getAssociatedTokenAddress(mint, new PublicKey(nft.owner));
	}
	const [proposalPda] = proposalAccountPda(votebank, proposalId);
	const [feePayerPdaAccount] = feePayerPda(votebank);
	const feePayerEnabled = Boolean(PUBLIC_ENABLE_FEE_PAYER);
	const tokenToAccountMetaFormat = isNftRestricted
		? [
				toAccountMetadata(tokenAccount),
				toAccountMetadata(nftMintMetadata),
				toAccountMetadata(restrictionMint)
		  ]
		: [];
	const [votepda] = voteAccountPda(votebank, mint, proposalId);
	//Commented out to avoid extra rpc call. Also prevents sneaking in a txn that will forsure fail. If somehow this becomes an issue uncomment.
	// const voteAccountFetched = await VoteAccount.fromAccountAddress(connection, votepda).catch(
	// 	(err) => {
	// 		console.log('vote account not found', err);
	// 		return null;
	// 	}
	// );
	// if (voteAccountFetched) {
	// 	return null;
	// }
	let voteInstructionAccounts: VoteInstructionAccounts = {
		voter: voter,
		feePayer: feePayerEnabled ? feePayerPdaAccount : undefined,
		votebank: votebank,
		proposal: proposalPda,
		votes: votepda,
		nftVoteMint: mint,
		treasury: TREASURY_ADDRESS,
		systemProgram: web3.SystemProgram.programId
	};
	let voteDelegateInstructionAccounts: VoteDelegationInstructionAccounts = {
		voter: voter,
		feePayer: feePayerEnabled ? feePayerPdaAccount : undefined,
		votebank: votebank,
		proposal: proposalPda,
		votes: votepda,
		nftVoteMint: mint,
		delegateAccount: delegateAccountAddress,
		treasury: TREASURY_ADDRESS,
		systemProgram: web3.SystemProgram.programId
	}
	if (isNftRestricted) {
		const accountIndices: AdditionalAccountIndices = {
			__kind: 'NftOwnership',
			tokenIdx: 0,
			metaIdx: 1,
			collectionIdx: 2
		};
		additionalAccountOffsets = [accountIndices];
	}
	voteInstructionAccounts.anchorRemainingAccounts = [...tokenToAccountMetaFormat];
	voteDelegateInstructionAccounts.anchorRemainingAccounts = [...tokenToAccountMetaFormat];
	const voteInstructionArgs: VoteInstructionArgs = {
		proposalId: proposalId,
		voteEntries,
		additionalAccountOffsets
	};
	const voteDelegateInstructionArgs: VoteDelegationInstructionArgs= {
		proposalId: proposalId,
		voteEntries,
		additionalAccountOffsets
	};
	return delegateAccount ? createVoteDelegationInstruction(voteDelegateInstructionAccounts,voteDelegateInstructionArgs, programId) : createVoteInstruction(voteInstructionAccounts, voteInstructionArgs, programId);
}

export async function buildTokenVoteIx(
	connection: Connection,
	voter: PublicKey,
	votebank: PublicKey,
	voteEntries: VoteEntry[],
	proposalId: number,
	proposalItem?: ProposalItem,
	programId: PublicKey = new PublicKey(PUBLIC_VOTE_PROGRAM)
): Promise<TransactionInstruction | null> {
	const votebankAccount = await Votebank.fromAccountAddress(connection, votebank);
	let proposal: ProposalItem | null;
	if (!proposalItem) {
		proposal = await fetchProposalById(connection, votebank, proposalId);
	} else {
		proposal = proposalItem;
	}
	if (!proposal) {
		return null;
	}

	const {
		restrictionMint: proposalRestrictionMint,
		isNftRestricted: proposalIsNftRestricted,
		restrictionIx: proposalRestrictionIx,
		ruleKind: proposalRulekind
	} = extractRestrictionData(proposal.settings);
	const votebankSettings = votebankAccount.settings as SettingsData[];
	const { restrictionMint, isNftRestricted, restrictionIx, ruleKind } =
		extractRestrictionData(votebankSettings);
	let mint = getDefaultPublicKey();
	let tokenAccount = getDefaultPublicKey();
	let additionalAccountOffsets: AdditionalAccountIndices[] = [
		{
			__kind: 'Null'
		}
	];

	if (restrictionIx && !isNftRestricted) {
		tokenAccount = await getAssociatedTokenAddress(restrictionMint, voter);
		/**
		 * Set the mint to the restriction mint since its a token. this needs to be passed as the nftVoteMint for ix
		 */
		mint = restrictionMint;
		tokenAccount = await getAssociatedTokenAddress(mint, voter);
	}
	const [proposalPda] = proposalAccountPda(votebank, proposalId);

	const tokenToAccountMetaFormat =
		restrictionIx && !isNftRestricted ? [toAccountMetadata(tokenAccount)] : [];
	//TODO: use voteTokenAccountPda when instruction is introduced
	const [votepda] = voteAccountPda(votebank, mint, proposalId);
	const voteAccountFetched = await VoteAccount.fromAccountAddress(connection, votepda).catch(
		(err) => {
			console.log('vote account not found, creating new one');
			return null;
		}
	);
	if (voteAccountFetched) {
		return null;
	}
	let voteInstructionAccounts: VoteInstructionAccounts = {
		voter: voter,
		feePayer: voter,
		votebank: votebank,
		proposal: proposalPda,
		votes: votepda,
		nftVoteMint: mint,
		treasury: TREASURY_ADDRESS,
		systemProgram: web3.SystemProgram.programId
	};
	if (!isNftRestricted) {
		const accountIndices: AdditionalAccountIndices = {
			__kind: 'TokenOwnership',
			tokenIdx: 0
		};
		additionalAccountOffsets = [accountIndices];
	}
	voteInstructionAccounts.anchorRemainingAccounts = [...tokenToAccountMetaFormat];
	const voteInstructionArgs: VoteInstructionArgs = {
		proposalId: proposalId,
		voteEntries,
		additionalAccountOffsets
	};
	//TODO: Make this the create VoteTokenInstruction when its introduced from the contract.
	return createVoteInstruction(voteInstructionAccounts, voteInstructionArgs, programId);
}
