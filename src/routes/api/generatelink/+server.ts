import { PRIVATE_SALT } from '$env/static/private';
import { PUBLIC_SOLANA_NETWORK } from '$env/static/public';
import type { RequestHandler } from '@sveltejs/kit';
import { dev } from '$app/environment';

// Use node:crypto in development, crypto-browserify in production
const getCrypto = async () => {
    if (dev) {
        return await import('node:crypto');
    } else {
        return await import('crypto-browserify');
    }
};

export const POST: RequestHandler = async (req) => {
    const { delegateAccountAddress } = await req.request.json();
    const origin = req.url.origin;
    const crypto = await getCrypto();

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