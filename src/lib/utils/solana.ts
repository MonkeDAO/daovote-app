import { PublicKey } from '@solana/web3.js';
import * as anchor from "@project-serum/anchor";

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

export function toAccountMetadata(key: PublicKey): { pubkey: PublicKey; isWritable: boolean; isSigner: boolean } {
    return {
        pubkey: key,
        isWritable: true,
        isSigner: false,
    };
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
    programId: anchor.web3.PublicKey,
    title: string
  ) {
    return findProgramAddress(
      [Buffer.from(CREATOR_SEED), Buffer.from(VOTEBANK_SEED), Buffer.from(title)],
      programId
    );
  }
  
  export function proposalAccountPda(
    programId: anchor.web3.PublicKey,
    votebank: anchor.web3.PublicKey,
    proposalId: number
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
    programId: anchor.web3.PublicKey,
    votebank: anchor.web3.PublicKey,
    nft: anchor.web3.PublicKey,
    proposalId: number
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