import { yahooFinance } from "./utils/yahooFinance.js";
import { cache } from "../utils/cache.js";

export async function getOptionChain(symbol: string, expiry?: string) {
	const cached = cache.getOptionsChain(symbol, expiry);
	if (cached) return cached;

	const data = await yahooFinance.options(symbol, {
		...(expiry ? { date: new Date(expiry) } : {}),
	});

	const result = {
		calls: (data?.options[0]?.calls ?? []).map((c) => ({
			strike: c.strike,
			oi: c.openInterest ?? 0,
		})),
		puts: (data?.options[0]?.puts ?? []).map((p) => ({
			strike: p.strike,
			oi: p.openInterest ?? 0,
		})),
	};

	cache.setOptionsChain(symbol, expiry, result);
	return result;
}
