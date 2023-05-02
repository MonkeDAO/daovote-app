import { writable, type Writable } from 'svelte/store';
import {
	ShdwDrive,
	type StorageAccountResponse,
	type CreateStorageResponse,
	type ShadowUploadResponse
} from '@shadow-drive/sdk';
import { Connection, PublicKey } from '@solana/web3.js';

export const driveStore: Writable<ShdwDrive | null> = writable(null);
export const forcedConnection = new Connection(
	'https://monkecbe3a1fff727446fa5fcd091ca9b7c02.xyz2.hyperplane.dev/',
	'confirmed'
); //shadow drive only works on mainnet
export async function uploadToShadowDrive(
	connection: any,
	wallet: any,
	shadowDrivePublicKey: PublicKey,
	file: any
): Promise<ShadowUploadResponse> {
	const drive = await new ShdwDrive(forcedConnection, wallet).init();
	const response = await drive.uploadFile(shadowDrivePublicKey, file);
	console.log('File uploaded successfully:', response);
	return response;
}

export async function getStorageAccounts(
	connection: Connection,
	wallet: any
): Promise<StorageAccountResponse[]> {
	const drive = await new ShdwDrive(forcedConnection, wallet).init();
	const response = await drive.getStorageAccounts('v2');
	return response;
}

export async function createStorageAccount(
	connection: Connection,
	wallet: any,
	name?: string
): Promise<CreateStorageResponse> {
	const drive = await new ShdwDrive(forcedConnection, wallet).init();
	const response = await drive.createStorageAccount(
		name ? name : `daovote_${wallet.publicKey}`,
		'100MB',
		'v2'
	);
	return response;
}
