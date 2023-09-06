import { PRIVATE_SALT } from '$env/static/private';
import { PUBLIC_SOLANA_NETWORK } from '$env/static/public';
import type { RequestHandler } from '@sveltejs/kit';
import crypto from 'crypto';

export const POST: RequestHandler = async (req) => {
    const { delegateAccountAddress, signature } = await req.request.json();
    if (!delegateAccountAddress) {
        return new Response(JSON.stringify({ error: 'Public key is required', valid: false }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
    }
    const isDevnet = PUBLIC_SOLANA_NETWORK === 'devnet';
    const expectedSignature = crypto.createHmac('sha256', PRIVATE_SALT)
    .update(delegateAccountAddress)
    .digest('hex');

    if (signature !== expectedSignature && !isDevnet) {
        return new Response(JSON.stringify({ error: 'Signature is invalid', valid: false }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const valid = true;
    
    return new Response(JSON.stringify({ valid }), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
		}
	});
}