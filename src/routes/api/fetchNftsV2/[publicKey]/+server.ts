// src/routes/+your-page/fetchNftsV2.ts
import type { RequestHandler } from '@sveltejs/kit';
import { web3 } from '@project-serum/anchor';
import type { HeliusDigitalAssetsResult, NftMetadata, HeliusDigitalAsset } from '$lib/types';
import { PRIVATE_HELIUS_URL } from '$env/static/private';
import { PUBLIC_COLLECTION_ADDRESSES } from '$env/static/public';
import { findProgramAddress } from '$lib/utils/solana';

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
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
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

	async function searchAssets(owner: string, url: string, collection: string) {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
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
		const { result } = (await response.json()) as HeliusDigitalAssetsResult;
		return result.items;
	};
	const collectionAddresses = PUBLIC_COLLECTION_ADDRESSES?.split(',').map((x: any) => (x as string)?.trim());
	let nftsRaw: HeliusDigitalAsset[] = [];
	if (collectionAddresses && collectionAddresses.length > 0) {
		for (var collectionAddress of collectionAddresses) {
			const assets = await searchAssets(publicKey, url, collectionAddress);
			nftsRaw = nftsRaw.concat(assets);
		}
		if (nftsRaw.length === 0) {
			nftsRaw = await getAssetsByOwner(publicKey, url);
		}
	}
	else {
		nftsRaw = await getAssetsByOwner(publicKey, url);
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
					owner: ownerPk.toBase58(),
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
	return new Response(JSON.stringify({ nfts }), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': `public, max-age=120` // 5 min
		}
	});
};
