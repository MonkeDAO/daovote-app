// src/routes/votebank/[address]/+page.ts 
/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
    const { id } = params;
    return {
      id
    }
  }
  