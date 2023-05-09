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
	options: { id: number; title: string }[];
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
	},
	collection?: {
		address?: string;
		verified?: boolean;
	},
	metadataAddress: string;
	owner: string;
	address: string;
}