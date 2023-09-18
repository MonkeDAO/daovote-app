import type { VoteAccount } from './anchor/accounts';

export type ContentItem = {
	title: string;
	description: string;
	id: number;
	content?: string;
	proposalMetadata?: ProposalMetadata;
	created_at?: Date;
	closing_date?: Date;
};

export type ProposalMetadata = {
	quorum_needed: number;
	winning_options: number;
	total_options: number;
	votes: Vote;
};

export type Vote = {
	total_count: number;
};

export type GHUser = {
	login: string;
	avatar_url: string;
	id: number;
	node_id: string;
	avatar_url: string;
	gravatar_id: string;
	url: string;
	html_url: string;
	followers_url: string;
	following_url: string;
	gists_url: string;
	starred_url: string;
	subscriptions_url: string;
	organizations_url: string;
	repos_url: string;
	events_url: string;
	received_events_url: string;
	type: 'User';
	site_admin: boolean;
};

export type GithubIssue = {
	user: GHUser;
	labels: {
		name: string;
	}[];
	title: string;
	body: string;
	created_at: Date;
	updated_at: Date;
	html_url: string;
	comments_url: string;
	reactions: GHReactions;
};

// Solana types
export type BalanceStore = {
	balance: number;
};

export type ProposalItem = {
	votebank: string;
	poster: string;
	data: ProposalData;
	options: { id: number; title: string; voteCount?: number | undefined }[];
	maxOptionsSelectable: number;
	settings: any[];
	voterCount: number;
	voteOpen: boolean;
	proposalId: number;
	endTime: beet.bignum;
};

export type ProposalData = {
	title: string;
	summary: string;
	url: string;
	time: number;
};

export type VoteBankProposalsNumeric = {
	votebank: string;
	open_proposals?: number[];
	closed_proposals?: number[];
};

export type VoteBankProposals = {
	votebank: string;
	open_proposals?: ProposalItem[];
	closed_proposals?: ProposalItem[];
};

export type VoteBankItem = {
	votebank: string;
	title: string;
	description: string;
};

export type CardItem = {
	title: string;
	description: string;
	url: string;
	endtime?: beet.bignum;
};

export type NftMetadata = {
	json: {
		name?: string;
		image?: string;
	};
	collection?: {
		address?: string;
		verified?: boolean;
		name?: string;
	};
	metadataAddress: string;
	owner: string;
	address: string;
	eligible?: boolean;
	voteAccount?: VoteAccount;
};

export type HeliusDigitalAssetResult = {
	jsonrpc: string;
	result: HeliusDigitalAsset;
};

export type HeliusDigitalAssetsResult = {
	jsonrpc: string;
	result: DigitalAssetsResults;
};

export type DigitalAssetsResults = {
	total: number;
	limit: number;
	page: number;
	items: HeliusDigitalAsset[];
};

export type HeliusDigitalAsset = {
	interface: string;
	id: string;
	content: Content;
	authorities: Authority[];
	compression: Compression;
	grouping: Grouping[];
	royalty: Royalty;
	creators: Creator[];
	ownership: Ownership;
	supply: number | null;
	mutable: boolean;
	burnt: boolean;
};

export type Authority = {
	address: string;
	scopes: string[];
};

export type Compression = {
	eligible: boolean;
	compressed: boolean;
	data_hash: string;
	creator_hash: string;
	asset_hash: string;
	tree: string;
	seq: number;
	leaf_id: number;
};

export type Content = {
	$schema: string;
	json_uri: string;
	files: File[];
	metadata: Metadata;
	links: Links;
};

export type File = {
	uri: string;
	cdn_uri: string;
	mime: string;
};

export type Links = {
	external_url: string;
};

export type Metadata = {
	attributes: Attribute[];
	description: string;
	name: string;
	symbol: string;
};

export type Attribute = {
	value: number | string;
	trait_type: string;
};

export type Creator = {
	address: string;
	share: number;
	verified: boolean;
};

export type Grouping = {
	group_key: string;
	group_value: string;
};

export type Ownership = {
	frozen: boolean;
	delegated: boolean;
	delegate: string | null;
	ownership_model: string;
	owner: string;
};

export type Royalty = {
	royalty_model: string;
	target: string | null;
	percent: number;
	basis_points: number;
	primary_sale_happened: boolean;
	locked: boolean;
};

export type DelegateAccountType = {
	address: string;
	owner: string;
	addresses: DelegateAddressType[]
}

export type DelegateAddressType = {
	address: string;
	signed: boolean;
}