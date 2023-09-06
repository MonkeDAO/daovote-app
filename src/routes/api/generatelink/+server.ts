import { PRIVATE_SALT } from '$env/static/private';
import { PUBLIC_SOLANA_NETWORK } from '$env/static/public';
import type { RequestHandler } from '@sveltejs/kit';
import crypto from 'crypto';

export const POST: RequestHandler = async (req) => {
    const { delegateAccountAddress } = await req.request.json();
    const origin = req.url.origin;

    if (!delegateAccountAddress) {
        return new Response(JSON.stringify({ error: 'Public key is required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
    }

    const signature = crypto.createHmac('sha256', PRIVATE_SALT)
        .update(delegateAccountAddress)
        .digest('hex');

    const link = `${PUBLIC_SOLANA_NETWORK === "devnet" ? origin : 'https://vote.monkedao.io'}/delegate/sign/${delegateAccountAddress}?signature=${signature}`;
    
    return new Response(JSON.stringify({ link }), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
		}
	});
}