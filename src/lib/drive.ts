import { writable, type Writable } from "svelte/store";
import type { ShdwDrive } from "@shadow-drive/sdk";

export const driveStore: Writable<ShdwDrive | null> = writable(null);