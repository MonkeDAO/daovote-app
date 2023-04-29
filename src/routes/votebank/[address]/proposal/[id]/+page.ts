// src/routes/votebank/[address]/+page.ts 

import { fetchProposalById } from "$lib/utils/solana";
import { web3 } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

/** @type {import('./$types').PageLoad} */
export async function load({ params }: any) {
    const { id, address } = params;
    const connection = new web3.Connection('https://silent-ultra-frost.solana-devnet.quiknode.pro/8b6a2a9f4d311c9588d17bd0b2ff7ce7b83cb5d5/');
    const data = await fetchProposalById(connection, new PublicKey(address), id);
    console.log('load proposal/id', data, id, address)
    if (data) {
      return {
        address,
        id,
        proposal: data
      }
    }
    return {
      address,
      id
    }
  }
  