//import YahooFinance from "yahoo-finance2";
import { cache } from "../utils/cache.js";
import type { MarketData } from "../types/services.js";
import { yahooFinance } from "./utils/yahooFinance.js";

//const yahooFinance = new YahooFinance();

export async function getMarketPrice(symbol: string, noCache?: boolean): Promise<MarketData> {
	if (!noCache) {
		const cached = cache.getMarketData(symbol);
		if (cached) {
			return cached;
		}
	}

	const quote = await yahooFinance.quote(symbol);
	const result: MarketData = {
		price: quote.regularMarketPrice,
		changePercentage: quote.regularMarketChangePercent,
		volume: quote.regularMarketVolume,
	};
	console.error(result);
	cache.setMarketData(symbol, result);

	return result;
}
