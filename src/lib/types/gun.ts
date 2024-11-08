export interface GunAck {
    err?: string;
    ok?: number;
    pub?: string;
}

export interface GunUser {
    alias: string;
    createdAt: number;
}

export interface IGunInstance {
    get(key: string): IGunInstance;
    put(data: any): IGunInstance;
    set(data: any): IGunInstance;
    map(callback: Function): IGunInstance;
    on(cb: (data: any, key: string) => void): void;
    once(cb: (data: any) => void): IGunInstance;
    user(): {
        create(alias: string, pass: string, cb: (ack: GunAck) => void): void;
        auth(alias: string, pass: string, cb: (ack: GunAck) => void): void;
        leave(): void;
        is?: {
            pub: string;
        };
    };
} 