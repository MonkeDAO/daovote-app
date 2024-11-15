const CACHE_DURATION = 60 * 1000; // 1 minute
const cache = new Map<string, { data: any, timestamp: number }>();

export function getCachedData(key: string) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    return null;
}

export function setCachedData(key: string, data: any) {
    cache.set(key, { data, timestamp: Date.now() });
} 