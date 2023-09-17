// src/routes/+your-page/fetchDelegate.ts
import type { RequestHandler } from '@sveltejs/kit';
import { web3 } from '@project-serum/anchor';
import { getDelegateAccount, getEnvNetwork } from '$lib/utils/solana';

export const GET: RequestHandler = async (request) => {
	const publicKeyStr = request.params.publicKey;
	
	if (!publicKeyStr) {
		return new Response(JSON.stringify({ error: 'Public key is required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

    const conn = getEnvNetwork();
    const publicKey = new web3.PublicKey(publicKeyStr);
    const delegateAccount = await getDelegateAccount(publicKey, conn);
	
	return new Response(JSON.stringify({ ...delegateAccount }), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': `public, max-age=120` // 5 min
		}
	});
};
