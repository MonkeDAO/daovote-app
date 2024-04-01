// src/routes/+your-page/fetchNftsV2.ts
import type { RequestHandler } from '@sveltejs/kit';
import { web3 } from '@project-serum/anchor';
import type { HeliusDigitalAssetsResult, NftMetadata, HeliusDigitalAsset } from '$lib/types';
import { PRIVATE_HELIUS_URL } from '$env/static/private';
import { PUBLIC_COLLECTION_ADDRESSES } from '$env/static/public';
import { findProgramAddress, getDelegateAccountType, getEnvNetwork } from '$lib/utils/solana';

const METADATA_PROGRAM_ID = new web3.PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

export const GET: RequestHandler = async (request) => {
	const publicKey = request.params.publicKey;
	const url = PRIVATE_HELIUS_URL;
	// const metaplex = Metaplex.make(new Connection(url)).use(guestIdentity());
	if (!publicKey) {
		return new Response(JSON.stringify({ error: 'Public key is required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}
	const ownerPk = new web3.PublicKey(publicKey);
	async function getAssetsByOwner(owner: string, url: string) {
		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Origin': 'https://vote.monkedao.io'
				},
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: `daovote_${owner}`,
					method: 'getAssetsByOwner',
					params: {
						ownerAddress: owner,
						page: 1,
						limit: 1000
					}
				})
			});
			const { result } = (await response.json()) as HeliusDigitalAssetsResult;
			//TODO: Paginate maybe later?
			return result.items;
		}
		catch (e) {
			console.error('Error: getAssetsByOwner', e);
			return [];
		}
	}

	async function searchAssets(owner: string, url: string, collection: string) {
		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Origin': 'https://vote.monkedao.io'
				},
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: 'my-id',
					method: 'searchAssets',
					params: {
						ownerAddress: owner,
						grouping: ["collection", collection],
						page: 1,
						limit: 1000
					},
				}),
			});
			const responseJson = await response.json();
			if (!responseJson.result || !responseJson.result.items) {
				console.log('Error: searchAssets', responseJson);
				return [];
			}
			const { result } = responseJson as HeliusDigitalAssetsResult;
			return result.items;
		}
		catch (e) {
			console.error('Error: searchAssets', e);
			return [];
		}
	};
	const conn = getEnvNetwork();
	const delegateAccount = await getDelegateAccountType(ownerPk, conn);
	const addresses: string[] = [publicKey];
	if (delegateAccount && delegateAccount?.addresses?.some(x => x.signed)) {
		//push all signed addresses to address array
		addresses.push(...delegateAccount.addresses.filter(x => x.signed).map(x => x.address));
	}
	const collectionAddresses = PUBLIC_COLLECTION_ADDRESSES?.split(',').map((x: any) => (x as string)?.trim().replace(/["']/g, ""));
	console.log('collectionAddresses', collectionAddresses);
	let nftsRaw: HeliusDigitalAsset[] = [];
	if (collectionAddresses && collectionAddresses.length > 0) {
		for (var collectionAddress of collectionAddresses) {
			//search assets for all addresses in address array
			//use promise.all to get all the nfts for each address
			const promises = addresses.map(address => searchAssets(address, url, collectionAddress));
			const assetsArray = await Promise.all(promises);
			nftsRaw = nftsRaw.concat(...assetsArray);
		}
		if (nftsRaw.length === 0) {
			//if no assets found, get all assets for all addresses in address array
			const promises = addresses.map(address => getAssetsByOwner(address, url));
			const assetsArray = await Promise.all(promises);
			nftsRaw = nftsRaw.concat(...assetsArray);
		}
	}
	else {
		//if no collection addresses, get all assets for all addresses in address array
		const promises = addresses.map(address => getAssetsByOwner(address, url));
		const assetsArray = await Promise.all(promises);
		nftsRaw = nftsRaw.concat(...assetsArray);
	}

	let nfts: NftMetadata[] = [];
	for (var nftRaw of nftsRaw) {
		if (nftRaw.compression.compressed) {
			//skip compressed nfts
			continue;
		}
		try {
			if (nftRaw.grouping.length > 0 && nftRaw.grouping[0].group_key === 'collection') {
				const [metadataAddress] = findProgramAddress(
					[
						Buffer.from('metadata'),
						METADATA_PROGRAM_ID.toBuffer(),
						new web3.PublicKey(nftRaw.id).toBuffer()
					],
					METADATA_PROGRAM_ID
				);

				const collectionAddress = nftRaw.grouping[0].group_value;
				//const collection = await getCollection(collectionAddress);
				nfts.push({
					metadataAddress: metadataAddress.toBase58(),
					address: nftRaw.id,
					owner: nftRaw.ownership.owner,
					json: {
						name: nftRaw.content.metadata.name,
						image: nftRaw.content.files.find((x) => x?.mime?.includes('image/'))?.uri
					},
					collection: {
						address: collectionAddress,
						//Can't get verified status from helius without looking at the token metadata
						verified: true,
						//Can't get collection name from helius without calling getAsset
						name: 'Unknown'
					}
				});
			}
		}
		catch (err) {
			console.log('bad metadata parsing', err, nftRaw);
		}

	}
	nfts = nfts.sort((a: NftMetadata, b: NftMetadata) => {
		if (a.collection?.name && b.collection?.name) {
			// Both have collection address, compare them
			return a.collection.name.localeCompare(b.collection.name);
		} else if (a.collection?.name) {
			// Only a has collection address, sort a before b
			return -1;
		} else if (b.collection?.name) {
			// Only b has collection address, sort b before a
			return 1;
		} else {
			// Neither has collection address, keep original order
			return 0;
		}
	});

	return new Response(JSON.stringify({ nfts, delegateAccount }), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': `public, max-age=120` // 5 min
		}
	});
};
