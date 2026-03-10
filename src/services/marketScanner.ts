import { yahooFinance } from "./utils/yahooFinance.js";
import { generateTradeSignal } from "./signal.js";
import type { ScanFilter, ScanResult } from "../types/services.js";

const UNIVERSE: Record<string, string[]> = {
	IT: ["TCS.NS", "INFY.NS", "WIPRO.NS", "HCLTECH.NS", "TECHM.NS", "LTI.NS"],
	BANKING: ["HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS", "KOTAKBANK.NS", "AXISBANK.NS", "BANKBARODA.NS"],
	ENERGY: ["RELIANCE.NS", "ONGC.NS", "IOC.NS", "BPCL.NS", "GAIL.NS"],
	FMCG: ["HINDUNILVR.NS", "ITC.NS", "NESTLEIND.NS", "BRITANNIA.NS", "DABUR.NS"],
	AUTO: ["MARUTI.NS", "TATAMOTORS.NS", "M&M.NS", "BAJAJ-AUTO.NS", "HEROMOTOCO.NS"],
	PHARMA: ["SUNPHARMA.NS", "DRREDDY.NS", "CIPLA.NS", "DIVISLAB.NS", "AUROPHARMA.NS"],
};

const ALL_SYMBOLS = Object.values(UNIVERSE).flat();

async function quickRsi(symbol: string): Promise<number> {
	try {
		const history = await yahooFinance.chart(symbol, {
			period1: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
			period2: new Date(),
		});
		const closes = history.quotes
			.filter((q) => q.close !== null)
			.map((q) => q.close!)
			.slice(-30);

		if (closes.length < 15) return 50;

		let gains = 0, losses = 0;
		for (let i = closes.length - 14; i < closes.length; i++) {
			const diff = (closes[i] ?? 0) - (closes[i - 1] ?? 0);
			diff >= 0 ? (gains += diff) : (losses += Math.abs(diff));
		}
		const rs = gains / (losses || 0.0001);
		return parseFloat((100 - 100 / (1 + rs)).toFixed(2));
	} catch {
		return 50;
	}
}

export async function scanMarket(filter: ScanFilter): Promise<ScanResult[]> {
	const symbols =
		filter.sector && UNIVERSE[filter.sector.toUpperCase()]
			? UNIVERSE[filter.sector.toUpperCase()]!
			: ALL_SYMBOLS;

	const results: ScanResult[] = [];

	const BATCH = 4;
	for (let i = 0; i < symbols.length; i += BATCH) {
		const batch = symbols.slice(i, i + BATCH);
		const batchResults = await Promise.allSettled(
			batch.map((symbol) => evaluateSymbol(symbol, filter))
		);
		for (const r of batchResults) {
			if (r.status === "fulfilled" && r.value !== null) {
				results.push(r.value);
			}
		}
	}

	return results.sort((a, b) => {
		if (filter.rsi_below !== undefined) return a.rsi - b.rsi;
		if (filter.rsi_above !== undefined) return b.rsi - a.rsi;
		return b.change - a.change;
	});
}

async function evaluateSymbol(
	symbol: string,
	filter: ScanFilter
): Promise<ScanResult | null> {
	try {
		const [quote, rsi] = await Promise.all([
			yahooFinance.quote(symbol),
			quickRsi(symbol),
		]);

		const change = quote.regularMarketChangePercent ?? 0;
		const volume = quote.regularMarketVolume ?? 0;
		const price = quote.regularMarketPrice ?? 0;

		if (filter.rsi_below !== undefined && rsi >= filter.rsi_below) return null;
		if (filter.rsi_above !== undefined && rsi <= filter.rsi_above) return null;
		if (filter.change_above !== undefined && change <= filter.change_above) return null;
		if (filter.change_below !== undefined && change >= filter.change_below) return null;
		if (filter.min_volume !== undefined && volume < filter.min_volume) return null;

		let signal: string | undefined;
		if (filter.signal) {
			const s = await generateTradeSignal(symbol, "1d");
			if (s.signal !== filter.signal) return null;
			signal = s.signal;
		}

		return {
			symbol,
			price: parseFloat(price.toFixed(2)),
			change: parseFloat(change.toFixed(2)),
			rsi,
			volume,
			...(signal !== undefined && { signal }),
		};
	} catch {
		return null;
	}
}
