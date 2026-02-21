import { v5 as uuidv5 } from 'uuid';
import crypto from 'crypto';
const DNS_NAMESPACE = uuidv5.DNS;
import { Request } from 'express';
import { redis } from '@lib/redis';

function getCacheKey(req: Request, seed = null) {
    const uri = req.originalUrl;

    if (seed !== null) {
        const seedString = uri + crypto.createHash("md5").update(JSON.stringify(seed)).digest("hex");
        return uuidv5(seedString, DNS_NAMESPACE);
    }

    return uuidv5(uri, DNS_NAMESPACE);
}

export function generateCacheKey(accountId: string, req: Request) {
    const key = getCacheKey(req)
    return `${accountId}:${key}`
}

export const cache = {
    async set(key: string, value: any, ttl?: number) {
        const data = JSON.stringify(value);
        if (ttl) {
            await redis.set(key, data, "EX", ttl);
        } else {
            await redis.set(key, data);
        }
    },

    async get<T = any>(key: string): Promise<T | null> {
        const data = await redis.get(key);
        return data ? (JSON.parse(data) as T) : null;
    },


    async remember(key: string) {

    },

    async del(key: string) {
        await redis.del(key);
    }
}

export const remember = async <T>(key: string, ttl: number, callback: () => Promise<T> | T) => {
    // Check cache
    const cached = await cache.get<T>(key);
    if (cached) {
        return cached;
    }

    // Run callback
    const result = await callback();

    // Store in cache
    await cache.set(key, result, ttl);

    return result;
};
