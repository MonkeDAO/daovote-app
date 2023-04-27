export type VoteBank = {
    maxChildId?:    number;
    moderatorMint?: string;
    settings?:      Setting[];
    openProposals?:  number[];
    closedProposals?: number[];
}

export type Setting = {
    ownerInfo?:       OwnerInfo;
    description?:     Description;
    voteRestriction?: SettingVoteRestriction;
}

export type Description = {
    title?: string;
    desc?:  string;
}

export type OwnerInfo = {
    owners?: string[];
}

export type SettingVoteRestriction = {
    voteRestriction?: VoteRestrictionVoteRestriction;
}

export type VoteRestrictionVoteRestriction = {
    tokenOwnership?: TokenOwnership;
    nftOwnership?:   NftOwnership;
} //and other vote restrictions!! dont forget to add

export type TokenOwnership = {
    mint?:   string;
    amount?: string;
}

export type NftOwnership = {
    collectionId?: string;
}

// Converts JSON strings to/from your types
export class ConvertVotebank {
    public static toVoteBank(json: string): VoteBank {
        return JSON.parse(json);
    }

    public static voteBankToJson(value: VoteBank): string {
        return JSON.stringify(value);
    }
}