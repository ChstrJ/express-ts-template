// import { CacheDuration } from '@common/constants/cache';
// import dotenv from 'dotenv';
// import { v5 as uuidv5 } from 'uuid';
// const DNS_NAMESPACE = uuidv5.DNS;

// dotenv.config();

// export class Cache {
//   protected client;
//   protected req;

//   constructor(client, req) {
//     this.client = client
//     this.req = req
//   }

//   getCacheKey() {
//     return uuidv5(this.req.originalUrl, DNS_NAMESPACE)
//   }

//   async redisCache(callback: Function | any, ttlSeconds: number = CacheDuration.DEFAULT_SECONDS) {
//     return this.remember(this.getCacheKey(), ttlSeconds, callback)
//   }

//   async remember(key: string, ttlSeconds: number, callback: Function) {

//     if (process.env.CACHE_ENABLED === 'false') {
//       return await callback();
//     }

//     const cached = await this.get(key)
//     if (cached != null) return cached;

//     const value = await callback();

//     await this.client.set(key, JSON.stringify(value), { EX: ttlSeconds });

//     return value;
//   }

//   async forget(key: string = this.getCacheKey()) {
//     if (process.env.CACHE_ENABLED === 'false') {
//       return;
//     }

//     await this.client.del(key);
//   }

//   async get(key: string) {
//     const data = await this.client.get(key);
//     return data ? JSON.parse(data) : null
//   }
// }
