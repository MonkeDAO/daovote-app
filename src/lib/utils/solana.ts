import { PublicKey, Connection, type AccountMeta } from '@solana/web3.js';
import * as anchor from "@project-serum/anchor";
import { Proposal } from '$lib/anchor/accounts';
import type { ProposalItem } from '$lib/types';

export const CREATOR_SEED: string = "monkedevs";
export const VOTEBANK_SEED: string = "votebank";
export const PROPOSAL_SEED: string = "proposal";
export const VOTE_SEED: string = "votes";
export const VOTE_PROGRAM_ID: anchor.web3.PublicKey = new anchor.web3.PublicKey("mvotp22LaMG3XrZgSHPSNH7gBCiorrLWfYKKKvTacvu");
export const SYSTEM_PROGRAM_ID: anchor.web3.PublicKey = new anchor.web3.PublicKey("11111111111111111111111111111111");

export const TREASURY_ADDRESS = new anchor.web3.PublicKey(
    "C9AYHDRn2GEhFjdNRZgHF2Ld7yCbJsGSE7RzUqyRiueC"
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
        isSigner: false,
    };
}

export async function fetchProposalById(connection: Connection, votebank: PublicKey, proposalId: number): Promise<ProposalItem | null> {
    try {
      const [proposalAddress] = proposalAccountPda(votebank, proposalId);
      const proposalAccount = await Proposal.fromAccountAddress(connection, proposalAddress);
      console.log('test', proposalAccount)
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
      }
      console.log('returning proposalItem', proposalItem)
      return proposalItem;
  } catch (err) {
    console.log('fetchProposalById', err);
      return null;
  }
}
export async function fetchProposals(connection: Connection, votebank: PublicKey, proposalIds: number[]): Promise<ProposalItem[]> {
  const proposals: ProposalItem[] = [];
  await Promise.all(proposalIds.map(async (proposalId) => {
      const proposal = await fetchProposalById(connection, votebank, proposalId);
      if (proposal) {
          proposals.push(proposal)
      }
  })); 
  console.log('returning proposals', proposals) 
  return proposals;
}

export function postDataToBuffer(proposalData: any): Buffer {
    const proposal = {
      title: proposalData.title,
      summary: proposalData.summary,
      url: proposalData.url,
      time: Math.floor(new Date().getTime() / 1000),
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
    programId: anchor.web3.PublicKey = VOTE_PROGRAM_ID,
  ) {
    return findProgramAddress(
      [Buffer.from(CREATOR_SEED), Buffer.from(VOTEBANK_SEED), Buffer.from(title)],
      programId
    );
  }
  
  export function proposalAccountPda(
    votebank: anchor.web3.PublicKey,
    proposalId: number,
    programId: anchor.web3.PublicKey = VOTE_PROGRAM_ID,
  ) {
    return findProgramAddress(
      [
        Buffer.from(CREATOR_SEED),
        Buffer.from(PROPOSAL_SEED),
        votebank.toBuffer(),
        toLittleEndianUint32(proposalId),
      ],
      programId
    );
  }
  
  // VOTE_SEED.as_bytes(), votebank.key().as_ref(), nft_vote_mint.key().as_ref(), &proposal_id.to_le_bytes()],
  export function voteAccountPda(
    votebank: anchor.web3.PublicKey,
    nft: anchor.web3.PublicKey,
    proposalId: number,
    programId: anchor.web3.PublicKey = VOTE_PROGRAM_ID,
  ) {
    return findProgramAddress(
      [
        Buffer.from(VOTE_SEED),
        votebank.toBuffer(),
        nft.toBuffer(),
        toLittleEndianUint32(proposalId),
      ],
      programId
    );
  }



  export function getExplorerUrl(network: string, path: 'address' | 'transaction', hash?: string): string {
    const baseUrl = "https://explorer.solana.com";
    const fullUrl = `${baseUrl}${path && hash ? `/${path}/${hash}` : ''}`;
    switch (network) {
      case "devnet":
        return `${fullUrl}?cluster=devnet`;
      case "testnet":
        return `${fullUrl}/?cluster=testnet`;
      case "mainnet-beta":
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