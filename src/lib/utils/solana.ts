import { PublicKey } from '@solana/web3.js';
import * as anchor from "@project-serum/anchor";

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
