import type { MarketData } from "../types/services.js";

interface CacheEntry<T> {
	value: T;
	expiry: number;
}

interface CacheType<T> {
	cache: Map<string, CacheEntry<T>>;
	ttlMs: number;
}

class Cache {
	private marketCache: CacheType<MarketData>;

	constructor() {
		this.marketCache = {
			cache: new Map<string, CacheEntry<MarketData>>(),
			ttlMs: 20_000,
		};
	}

	setMarketData(symbol: string, value: MarketData) {
		this.marketCache.cache.set(symbol, {
			value,
			expiry: Date.now() + this.marketCache.ttlMs,
		});
	}

	getMarketData(symbol: string): MarketData | null {
		const entry = this.marketCache.cache.get(symbol);

		if (!entry) return null;

		if (Date.now() > entry.expiry) {
			this.marketCache.cache.delete(symbol);
			return null;
		}

		return entry.value;
	}
}

export const cache = new Cache();
