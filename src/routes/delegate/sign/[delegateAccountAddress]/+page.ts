// src/routes/votebank/[address]/+page.ts

import { DelegateAccount } from '$lib/anchor/accounts';
import { getEnvNetwork, getDelegateAccount, isValidSolAddress } from '$lib/utils/solana';
import { PublicKey } from "@solana/web3.js";

/** @type {import('./$types').PageLoad} */
export async function load({ params }: any) {
	const { delegateAccountAddress } = params;
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
