// src/routes/+your-page/fetchNftsV2.ts
import type { RequestHandler } from '@sveltejs/kit';
import { web3 } from '@project-serum/anchor';
import type { HeliusDigitalAsset, NftMetadata } from '$lib/types';
import { PRIVATE_HELIUS_URL } from '$env/static/private';
// import { Metaplex, guestIdentity } from '@metaplex-foundation/js';
// import { Connection, PublicKey } from '@solana/web3.js';

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
	// interface CollectionDictionary {
	// 	[address: string]: any;
	// }

	// const collections: CollectionDictionary = {};

	// async function getCollection(address: string | undefined) {
	// 	if (!address) {
	// 		return null;
	// 	}
	// 	if (collections[address]) {
	// 		// Collection has already been fetched, return the cached value
	// 		return collections[address];
	// 	} else {
	// 		// Collection has not been fetched, fetch and cache it
	// 		try {
	// 			const collection = await metaplex.nfts().findByMint({ mintAddress: new PublicKey(address) });
	// 			collections[address] = collection;
	// 			return collection;
	// 		}
	// 		catch (err) {
	// 			console.log('bad collection', err, address);
	// 		}
	// 	}
	// }
    async function getAssetsByOwner(owner: string, url: string) {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'my-id',
            method: 'getAssetsByOwner',
            params: {
              ownerAddress: owner,
              page: 1, // Starts at 1
              limit: 1000
            },
          }),
        });
        const { result } = await response.json();
        console.log(result);
        //TODO: Paginate maybe later?
        return result.items as HeliusDigitalAsset[];
      };

	const nftsRaw = await getAssetsByOwner(publicKey, url);
	let nfts: NftMetadata[] = [];
	for (var nftRaw of nftsRaw) {
        if (nftRaw.compression.compressed) {
            //skip compressed nfts
            continue;
        }
		
			if (nftRaw.grouping.length > 0 && nftRaw.grouping[0].group_key === 'collection') {
                const collectionAddress = nftRaw.grouping[0].group_value;
				//const collection = await getCollection(collectionAddress);
				nfts.push({
                    //TODO: GET METADATA ADDRESS FROM METAPLEX OR SOMETHING
					metadataAddress: nftRaw.id,
					address: nftRaw.id,
					owner: ownerPk.toBase58(),
					json: {
						name: nftRaw.content.metadata.name,
						image: nftRaw.content.files.find(x => x.mime == 'image/png')?.uri,
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
