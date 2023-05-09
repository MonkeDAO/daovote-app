// src/routes/+your-page/fetchNfts.ts
import { Metaplex, guestIdentity, type Metadata, PublicKey } from '@metaplex-foundation/js';
import type { RequestHandler } from '@sveltejs/kit';
import { web3 } from '@project-serum/anchor';
import { clusterApiUrl } from '@solana/web3.js';
import type { NftMetadata } from '$lib/types';

export const GET: RequestHandler = async (request) => {
	const publicKey = request.params.publicKey;
	const connection = new web3.Connection(clusterApiUrl('devnet'));
	const metaplex = Metaplex.make(connection).use(guestIdentity());
	if (!publicKey) {
		return new Response(JSON.stringify({ error: 'Public key is required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}
	const ownerPk = new web3.PublicKey(publicKey);
	interface CollectionDictionary {
		[address: string]: any;
	}

	const collections: CollectionDictionary = {};

	async function getCollection(address: string | undefined) {
		if (!address) {
			return null;
		}
		if (collections[address]) {
			// Collection has already been fetched, return the cached value
			return collections[address];
		} else {
			// Collection has not been fetched, fetch and cache it
			const collection = await metaplex.nfts().findByMint({ mintAddress: new PublicKey(address) });
			collections[address] = collection;
			return collection;
		}
	}

	const nftsRaw = await metaplex.nfts().findAllByOwner({ owner: ownerPk });
	let nfts: NftMetadata[] = [];
	for (var nftRaw of nftsRaw) {
		const res = await fetch(nftRaw.uri).catch((err) => {
			console.log('bad metadata uri skipping', err);
		});
		if (res) {
			const data = await res.json().catch((err) => {
				console.log('bad Json skipping', err);
			});
			if (data) {
				const collection = await getCollection(nftRaw.collection?.address?.toBase58());
				nfts.push({
					metadataAddress: nftRaw.address.toBase58(),
					address: (nftRaw as Metadata)['mintAddress'].toBase58(),
					owner: ownerPk.toBase58(),
					json: {
						name: data.name,
						image: data.image
					},
					collection: {
						address: nftRaw.collection?.address?.toBase58(),
						verified: nftRaw.collection?.verified,
						name: collection?.json?.name ?? 'Unknown'
					}
				});
			}
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
			'Cache-Control': `public, max-age=3600` // 1 hour
		}
	});
};
