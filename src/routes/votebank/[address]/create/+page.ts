// src/routes/votebank/[address]/+page.ts
/** @type {import('./$types').PageLoad} */
export async function load({ params }: any) {
	const { address } = params;
	return {
		address
	};
}
