// src/routes/votebank/[address]/+page.ts
import { DelegateAccount } from '$lib/anchor/accounts';
import { getEnvNetwork, getDelegateAccount, isValidSolAddress } from '$lib/utils/solana';
import { PublicKey } from "@solana/web3.js";

/** @type {import('./$types').PageLoad} */
export async function load({ params, url, fetch }: any) {
	const { delegateAccountAddress } = params;
    const signature = url.searchParams.get('signature') || '';
    if (!signature) {
        return {
            status: 404,
            error: new Error('Signature is required')
        };
    }
    const resp = await fetch('/api/generatelink/verify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            delegateAccountAddress,
            signature
        })
    });
    const { error, valid } = await resp.json();
    console.log('error from resp', error, valid);
    if (!valid) {
        return {
            status: 400,
            error: new Error(error)
        };
    }
    const connection = getEnvNetwork();
    if (!isValidSolAddress(delegateAccountAddress)) {
        return {
            status: 404,
            error: new Error('Delegate account address is invalid')
        };
    }
    const publicKeyFromParam = new PublicKey(delegateAccountAddress);
    let delegateAccount = null;
    let delegateAccountPda = null;
    if (!PublicKey.isOnCurve(publicKeyFromParam)) {
       const delegateAccountRaw = await DelegateAccount.fromAccountAddress(connection, publicKeyFromParam).catch(() => { return null; });
       delegateAccount = delegateAccountRaw?.pretty() || null;
       delegateAccountPda = publicKeyFromParam.toBase58();
    }
    else {
        const delegateAccountRaw = await getDelegateAccount(publicKeyFromParam, connection);
        delegateAccount = delegateAccountRaw?.delegateAccount?.pretty() || null;
        delegateAccountPda = delegateAccountRaw?.address.toBase58();
    }
	return {
		delegateAccount,
        delegateAccountAddress: delegateAccountPda
	};
}
