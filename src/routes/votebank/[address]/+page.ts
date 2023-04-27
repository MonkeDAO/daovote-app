// src/routes/votebank/[address]/+page.ts 
/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
  const { address } = params;
  return {
    address
  }
}
