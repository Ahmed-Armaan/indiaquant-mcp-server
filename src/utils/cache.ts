import type { MarketData } from "../types/services.js";
import type { OptionsChainData } from "../types/services.js";
import type { SentimentResult } from "../types/services.js";
import type { GreeksResult } from "../types/services.js";

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
	private optionsChanCache: CacheType<OptionsChainData>;
	private sentimentCache: CacheType<SentimentResult>;
	private greeksCache: CacheType<GreeksResult>;

	constructor() {
		this.marketCache = {
			cache: new Map<string, CacheEntry<MarketData>>(),
			ttlMs: 20_000,
		};

		this.optionsChanCache = {
			cache: new Map<string, CacheEntry<OptionsChainData>>(),
			ttlMs: 60_000,
		};

		this.sentimentCache = {
			cache: new Map(),
			ttlMs: 5 * 60_000
		};

		this.greeksCache = {
			cache: new Map<string, CacheEntry<GreeksResult>>(),
			ttlMs: 5 * 60_000,
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

	setOptionsChain(symbol: string, expiry: string | undefined, value: OptionsChainData) {
		const key = `${symbol}:${expiry ?? "nearest"}`;
		this.optionsChanCache.cache.set(key, {
			value,
			expiry: Date.now() + this.optionsChanCache.ttlMs,
		});
	}

	getOptionsChain(symbol: string, expiry: string | undefined): OptionsChainData | null {
		const key = `${symbol}:${expiry ?? "nearest"}`;
		const entry = this.optionsChanCache.cache.get(key);
		if (!entry) return null;
		if (Date.now() > entry.expiry) {
			this.optionsChanCache.cache.delete(key);
			return null;
		}
		return entry.value;
	}

	setSentiment(symbol: string, value: SentimentResult) {
		this.sentimentCache.cache.set(symbol, {
			value,
			expiry: Date.now() + this.sentimentCache.ttlMs,
		});
	}

	getSentiment(symbol: string): SentimentResult | null {
		const entry = this.sentimentCache.cache.get(symbol);
		if (!entry) return null;
		if (Date.now() > entry.expiry) {
			this.sentimentCache.cache.delete(symbol);
			return null;
		}
		return entry.value;
	}

	setGreeks(symbol: string, value: GreeksResult) {
		this.greeksCache.cache.set(symbol, {
			value,
			expiry: Date.now() + this.greeksCache.ttlMs,
		});
	}

	getGreeks(symbol: string): GreeksResult | null {
		const entry = this.greeksCache.cache.get(symbol);
		if (!entry) return null;
		if (Date.now() > entry.expiry) {
			this.greeksCache.cache.delete(symbol);
			return null;
		}
		return entry.value;
	}
}

export const cache = new Cache();
