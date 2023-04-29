import { fetchBanks } from '$lib/votebanks';
/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export async function GET({ setHeaders }: any) {
	let list = await fetchBanks();
	list = list.map((item) => {
		return item
	});
	setHeaders({
		'Cache-Control': `public, max-age=3600` // 1 hour
	});
	return new Response(JSON.stringify(list), {
		headers: {
			'content-type': 'application/json; charset=utf-8'
		}
	});
}

