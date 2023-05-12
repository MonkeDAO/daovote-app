import {
	PublicKey,
	Connection,
	type AccountMeta,
	type TransactionError,
	clusterApiUrl,
	type Cluster,
	Transaction
} from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { Proposal, VoteAccount } from '$lib/anchor/accounts';
import type { ProposalItem } from '$lib/types';
import {
	isSettingsDataVoteRestriction,
	isVoteRestrictionRuleNftListAnyOwnership,
	isVoteRestrictionRuleNftOwnership,
	isVoteRestrictionRuleNull,
	isVoteRestrictionRuleTokenOrNftAnyOwnership,
	isVoteRestrictionRuleTokenOwnership,
	type SettingsData,
	type VoteRestrictionRule
} from '$lib/anchor/types';
import { errorFromCode } from '$lib/anchor/errors';
import { PUBLIC_SOLANA_NETWORK, PUBLIC_RPC_URL } from '$env/static/public';

export const CREATOR_SEED: string = 'monkedevs';
export const VOTEBANK_SEED: string = 'votebank';
export const PROPOSAL_SEED: string = 'proposal';
export const VOTE_SEED: string = 'votes';
export const VOTE_PROGRAM_ID: anchor.web3.PublicKey = new anchor.web3.PublicKey(
	'mvotp22LaMG3XrZgSHPSNH7gBCiorrLWfYKKKvTacvu'
);
export const SYSTEM_PROGRAM_ID: anchor.web3.PublicKey = new anchor.web3.PublicKey(
	'11111111111111111111111111111111'
);

export const TREASURY_ADDRESS = new anchor.web3.PublicKey(
	'C9AYHDRn2GEhFjdNRZgHF2Ld7yCbJsGSE7RzUqyRiueC'
);
export function isValidSolAddress(key: string): boolean {
	try {
		new PublicKey(key);
		return true;
	} catch (err) {
		return false;
	}
}

export function mapKeysToPublicKeys(keys: string[]): PublicKey[] {
	return keys.map((key) => new PublicKey(key));
}

export function toLittleEndianUint32(number: number): Uint8Array {
	const buffer = new ArrayBuffer(4);
	const view = new DataView(buffer);
	view.setUint32(0, number, true);
	return new Uint8Array(buffer);
}

export function getDefaultPublicKey(): PublicKey {
	return new PublicKey('11111111111111111111111111111111');
}

export function isDefaultPublicKey(key: PublicKey): boolean {
	return key.equals(getDefaultPublicKey());
}

export function toAccountMetadata(key: PublicKey): AccountMeta {
	return {
		pubkey: key,
		isWritable: true,
		isSigner: false
	};
}

export function bnToDate(bnTimestamp: anchor.BN): Date {
	const timestampSeconds = bnTimestamp.toNumber();
	const timestampMilliseconds = timestampSeconds * 1000;
	const date = new Date(timestampMilliseconds);
	return date;
}

export function dateToBn(dateOrString: Date | string): anchor.BN {
	// Create a new Date object from the input, if it's a date string
	const date = typeof dateOrString === 'string' ? new Date(dateOrString) : dateOrString;
	const timestampMilliseconds = date.getTime();
	const timestampSeconds = Math.floor(timestampMilliseconds / 1000);
	const bnTimestamp = new anchor.BN(timestampSeconds);

	return bnTimestamp;
}

export async function fetchProposalById(
	connection: Connection,
	votebank: PublicKey,
	proposalId: number
): Promise<ProposalItem | null> {
	try {
		const [proposalAddress] = proposalAccountPda(votebank, proposalId);
		const proposalAccount = await Proposal.fromAccountAddress(connection, proposalAddress);
		console.log('test', proposalAccount);
		//const proposalData = bufferToPostData(proposalAccount.data);
		// eslint-disable-next-line no-unused-vars
		const { data, poster, ...rest } = proposalAccount;
		const decode = new TextDecoder();
		const dataDecoded = decode.decode(data);
		const obj = JSON.parse(dataDecoded);
		const proposalItem: ProposalItem = {
			votebank: votebank.toBase58(),
			poster: poster.toBase58(),
			data: obj,
			...rest
		};
		return proposalItem;
	} catch (err) {
		console.log('fetchProposalById', err);
		return null;
	}
}
export async function fetchProposals(
	connection: Connection,
	votebank: PublicKey,
	proposalIds: number[]
): Promise<ProposalItem[]> {
	const proposals: ProposalItem[] = [];
	await Promise.all(
		proposalIds.map(async (proposalId) => {
			const proposal = await fetchProposalById(connection, votebank, proposalId);
			if (proposal) {
				proposals.push(proposal);
			}
		})
	);
	console.log('returning proposals', proposals);
	return proposals.sort((a, b) => {
		// first sort by voteCount in descending order
		if (a.voterCount > b.voterCount) return -1;
		if (a.voterCount < b.voterCount) return 1;

		// if voteCount is equal, sort by proposalId in ascending order
		if (a.proposalId > b.proposalId) return 1;
		if (a.proposalId < b.proposalId) return -1;

		return 0; // if both voteCount and proposalId are equal
	});
}

export function extractCustomCodes(err: TransactionError | string | null): string[] {
	let customValues: number[] = [];

	if (typeof err === 'object' && err !== null) {
		findCustomValues(err); // find all "Custom" values
	}

	function findCustomValues(obj: any) {
		for (let key in obj) {
			if (key === 'Custom') {
				customValues.push(obj[key]);
			} else if (typeof obj[key] === 'object' && obj[key] !== null) {
				findCustomValues(obj[key]);
			}
		}
	}
	const messages = customValues
		.map((code) => errorFromCode(code))
		.map((x) => {
			if (x && x.message) return x.message;
			else return '';
		})
		.filter((x) => x !== '');

	return messages;
}

export function postDataToBuffer(proposalData: any): Buffer {
	const proposal = {
		title: proposalData.title,
		summary: proposalData.summary,
		url: proposalData.url,
		time: Math.floor(new Date().getTime() / 1000)
	};
	const dataString = JSON.stringify(proposal);
	return Buffer.from(dataString);
}

export function bufferToPostData(buffer: Buffer | unknown): any {
	if (!buffer) {
		return null;
	}
	const jsonString = buffer.toString();
	return JSON.parse(jsonString);
}

export function findProgramAddress(
	seeds: (Uint8Array | Buffer)[],
	programId: PublicKey
): [PublicKey, number] {
	return anchor.utils.publicKey.findProgramAddressSync([...seeds], programId);
}

export function getProgram<T extends anchor.Idl>(
	provider: anchor.AnchorProvider,
	key: string
): anchor.Program<T> {
	const program = anchor.workspace[key] as anchor.Program<T>;
	return program;
}

export function votebankAccountPda(
	title: string,
	programId: anchor.web3.PublicKey = VOTE_PROGRAM_ID
) {
	return findProgramAddress(
		[Buffer.from(CREATOR_SEED), Buffer.from(VOTEBANK_SEED), Buffer.from(title)],
		programId
	);
}

export function proposalAccountPda(
	votebank: anchor.web3.PublicKey,
	proposalId: number,
	programId: anchor.web3.PublicKey = VOTE_PROGRAM_ID
) {
	return findProgramAddress(
		[
			Buffer.from(CREATOR_SEED),
			Buffer.from(PROPOSAL_SEED),
			votebank.toBuffer(),
			toLittleEndianUint32(proposalId)
		],
		programId
	);
}

// VOTE_SEED.as_bytes(), votebank.key().as_ref(), nft_vote_mint.key().as_ref(), &proposal_id.to_le_bytes()],
export function voteAccountPda(
	votebank: anchor.web3.PublicKey,
	nft: anchor.web3.PublicKey,
	proposalId: number,
	programId: anchor.web3.PublicKey = VOTE_PROGRAM_ID
) {
	return findProgramAddress(
		[Buffer.from(VOTE_SEED), votebank.toBuffer(), nft.toBuffer(), toLittleEndianUint32(proposalId)],
		programId
	);
}

export async function voteAccountPdaExists(
	connection: anchor.web3.Connection,
	votebank: anchor.web3.PublicKey,
	nft: anchor.web3.PublicKey,
	proposalId: number,
	programId: anchor.web3.PublicKey = VOTE_PROGRAM_ID
): Promise<boolean> {
	const [voteAccount] = voteAccountPda(votebank, nft, proposalId, programId);
	const voteAccountStruct = await VoteAccount.fromAccountAddress(connection, voteAccount).catch(
		(e) => console.log('voteAccount doesnt exist', e)
	);
	console.log('voteAccountStruct', voteAccountStruct, nft.toBase58());
	return voteAccountStruct !== undefined;
}

export function getEnvNetwork(
	commitment: anchor.web3.Commitment = 'confirmed'
): anchor.web3.Connection {
	const network = PUBLIC_SOLANA_NETWORK as Cluster;
	const rpcUrl = PUBLIC_RPC_URL;
	if (!rpcUrl) {
		return new anchor.web3.Connection(clusterApiUrl(network), commitment);
	}
	return new anchor.web3.Connection(rpcUrl, commitment);
}

export function getExplorerUrl(
	network: string,
	path: 'address' | 'transaction',
	hash?: string
): string {
	const baseUrl = 'https://explorer.solana.com';
	const fullUrl = `${baseUrl}${path && hash ? `/${path}/${hash}` : ''}`;
	switch (network) {
		case 'devnet':
			return `${fullUrl}?cluster=devnet`;
		case 'testnet':
			return `${fullUrl}/?cluster=testnet`;
		case 'mainnet-beta':
			return `${fullUrl}`;
		default:
			throw new Error(`Unsupported network: ${network}`);
	}
}
export function trimAddress(str: string): string {
	const maxLength = 10; //needs to be atleast 10 characters

	if (str.length <= maxLength) {
		return str;
	}

	const ellipsis = '...';
	const start = str.slice(0, 5);
	const end = str.slice(-4);

	return `${start}${ellipsis}${end}`;
}

export function extractRestrictionData(settings: SettingsData[]) {
	const voteRestriction = settings.find(isSettingsDataVoteRestriction);
	let ruleKind = VoteRestrictionRuleKindMap.Null;
	let restrictionMint = getDefaultPublicKey();
	let isNftRestricted = false;
	let restrictionIx = false;
	if (voteRestriction) {
		const voteRestrictionValue = isSettingsDataVoteRestriction(voteRestriction)
			? voteRestriction.voteRestriction
			: null;
		//Due to typescript type safety have to do explicit if checks... >:(
		if (voteRestrictionValue) {
			if (isVoteRestrictionRuleTokenOwnership(voteRestrictionValue)) {
				ruleKind = VoteRestrictionRuleKindMap.TokenOwnership;
				restrictionIx = true;
				restrictionMint = voteRestrictionValue.mint;
			} else if (isVoteRestrictionRuleNftOwnership(voteRestrictionValue)) {
				ruleKind = VoteRestrictionRuleKindMap.NftOwnership;
				restrictionIx = true;
				restrictionMint = voteRestrictionValue.collectionId;
				isNftRestricted = true;
			} else if (isVoteRestrictionRuleTokenOrNftAnyOwnership(voteRestrictionValue)) {
				ruleKind = VoteRestrictionRuleKindMap.TokenOrNftAnyOwnership;
				//TODO: handle this
			} else if (isVoteRestrictionRuleNftListAnyOwnership(voteRestrictionValue)) {
				ruleKind = VoteRestrictionRuleKindMap.NftListAnyOwnership;
				//TODO: handle this
			} else if (isVoteRestrictionRuleNull(voteRestrictionValue)) {
				ruleKind = VoteRestrictionRuleKindMap.Null;
				//TODO: handle this
			}
		}
	}
	return {
		restrictionMint,
		isNftRestricted,
		restrictionIx,
		ruleKind
	};
}

export enum VoteRestrictionRuleKindMap {
	TokenOwnership = 'TokenOwnership',
	NftOwnership = 'NftOwnership',
	Null = 'Null',
	NftListAnyOwnership = 'NftListAnyOwnership',
	TokenOrNftAnyOwnership = 'TokenOrNftAnyOwnership'
}

export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param tx a solana transaction
 * @param feePayer the publicKey of the signer
 * @returns size in bytes of the transaction
 */
export const getTxSize = (tx: Transaction, feePayer: PublicKey): number => {
	const feePayerPk = [feePayer.toBase58()];

	const signers = new Set<string>(feePayerPk);
	const accounts = new Set<string>(feePayerPk);

	const ixsSize = tx.instructions.reduce((acc, ix) => {
		ix.keys.forEach(({ pubkey, isSigner }) => {
			const pk = pubkey.toBase58();
			if (isSigner) signers.add(pk);
			accounts.add(pk);
		});

		accounts.add(ix.programId.toBase58());

		const nIndexes = ix.keys.length;
		const opaqueData = ix.data.length;

		return (
			acc +
			1 + // PID index
			compactArraySize(nIndexes, 1) +
			compactArraySize(opaqueData, 1)
		);
	}, 0);

	return (
		compactArraySize(signers.size, 64) + // signatures
		3 + // header
		compactArraySize(accounts.size, 32) + // accounts
		32 + // blockhash
		compactHeader(tx.instructions.length) + // instructions
		ixsSize
	);
};

// COMPACT ARRAY

const LOW_VALUE = 127; // 0x7f
const HIGH_VALUE = 16383; // 0x3fff

/**
 * Compact u16 array header size
 * @param n elements in the compact array
 * @returns size in bytes of array header
 */
const compactHeader = (n: number) => (n <= LOW_VALUE ? 1 : n <= HIGH_VALUE ? 2 : 3);

/**
 * Compact u16 array size
 * @param n elements in the compact array
 * @param size bytes per each element
 * @returns size in bytes of array
 */
const compactArraySize = (n: number, size: number) => compactHeader(n) + n * size;

export async function chunkArray<T>(array: T[], chunkSize: number): Promise<T[][]> {
	const results = [];
	while (array.length) {
		results.push(array.splice(0, chunkSize));
	}
	return results;
}
