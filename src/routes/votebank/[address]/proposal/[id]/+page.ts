// src/routes/votebank/[address]/+page.ts 

import { fetchProposalById } from "$lib/utils/solana";
import { web3 } from "@project-serum/anchor";
import { PublicKey, clusterApiUrl } from "@solana/web3.js";

/** @type {import('./$types').PageLoad} */
export async function load({ params }: any) {
    const { id, address } = params;
    const connection = new web3.Connection(clusterApiUrl('devnet'));
    const data = await fetchProposalById(connection, new PublicKey(address), id);
    console.log('load proposal/id', data, id, address)
    return {
      address,
      id,
      proposal: data
    }
  }
  