//import { yahooFinance } from "./utils/yahooFinance.js";
//
//function normalPDF(x: number) {
//	return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
//}
//
//function normalCDF(x: number) {
//	const t = 1 / (1 + 0.2316419 * Math.abs(x));
//	const d = 0.3989423 * Math.exp(-x * x / 2);
//
//	let prob =
//		d * t *
//		(0.3193815 +
//			t *
//			(-0.3565638 +
//				t * (1.781478 + t * (-1.821256 + t * 1.330274))));
//
//	if (x > 0) prob = 1 - prob;
//
//	return prob;
//}
//
//function timeToExpiry(expirationDate: Date) {
//	const now = Date.now();
//	const expiry = expirationDate.getTime();
//
//	return (expiry - now) / (365 * 24 * 60 * 60 * 1000);
//}
//
//function computeGreeks(
//	S: number,
//	K: number,
//	T: number,
//	r: number,
//	sigma: number,
//	type: "call" | "put"
//) {
//	if (sigma <= 0 || T <= 0) return null;
//
//	const d1 =
//		(Math.log(S / K) + (r + 0.5 * sigma ** 2) * T) /
//		(sigma * Math.sqrt(T));
//
//	const d2 = d1 - sigma * Math.sqrt(T);
//
//	const pdf = normalPDF(d1);
//
//	const delta =
//		type === "call"
//			? normalCDF(d1)
//			: normalCDF(d1) - 1;
//
//	const gamma =
//		pdf / (S * sigma * Math.sqrt(T));
//
//	const vega =
//		S * pdf * Math.sqrt(T);
//
//	let theta;
//
//	if (type === "call") {
//		theta =
//			-(S * pdf * sigma) / (2 * Math.sqrt(T)) -
//			r * K * Math.exp(-r * T) * normalCDF(d2);
//	} else {
//		theta =
//			-(S * pdf * sigma) / (2 * Math.sqrt(T)) +
//			r * K * Math.exp(-r * T) * normalCDF(-d2);
//	}
//
//	return { delta, gamma, theta, vega };
//}
//
//export async function calculateGreeks(symbol: string) {
//	const data = await yahooFinance.options(symbol);
//	if (!data || !data.options?.[0]) {
//		throw new Error(`No option data for ${symbol}`);
//	}
//
//	const firstExpiry = data.options[0];
//	const S = data.quote.regularMarketPrice;
//	const T = timeToExpiry(firstExpiry.expirationDate);
//	const r = 0.07;
//	const calls = firstExpiry.calls
//		.map(c => {
//			const g = computeGreeks(
//				S,
//				c.strike,
//				T,
//				r,
//				c.impliedVolatility ?? 0,
//				"call"
//			);
//
//			if (!g) return null;
//
//			return {
//				symbol: c.contractSymbol,
//				strike: c.strike,
//				...g
//			};
//		})
//		.filter(Boolean);
//
//	const puts = firstExpiry.puts
//		.map(p => {
//			const g = computeGreeks(
//				S,
//				p.strike,
//				T,
//				r,
//				p.impliedVolatility ?? 0,
//				"put"
//			);
//
//			if (!g) return null;
//
//			return {
//				symbol: p.contractSymbol,
//				strike: p.strike,
//				...g
//			};
//		})
//		.filter(Boolean);
//
//	return {
//		symbol,
//		underlyingPrice: S,
//		expiration: firstExpiry.expirationDate,
//		calls,
//		puts
//	};
//}

import { yahooFinance } from "./utils/yahooFinance.js";
import { cache } from "../utils/cache.js";
import type { GreeksResult } from "../types/services.js";

function normalPDF(x: number) {
	return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}
function normalCDF(x: number) {
	const t = 1 / (1 + 0.2316419 * Math.abs(x));
	const d = 0.3989423 * Math.exp(-x * x / 2);
	let prob =
		d * t *
		(0.3193815 +
			t *
			(-0.3565638 +
				t * (1.781478 + t * (-1.821256 + t * 1.330274))));
	if (x > 0) prob = 1 - prob;
	return prob;
}
function timeToExpiry(expirationDate: Date) {
	const now = Date.now();
	const expiry = expirationDate.getTime();
	return (expiry - now) / (365 * 24 * 60 * 60 * 1000);
}
function computeGreeks(
	S: number,
	K: number,
	T: number,
	r: number,
	sigma: number,
	type: "call" | "put"
) {
	if (sigma <= 0 || T <= 0) return null;
	const d1 =
		(Math.log(S / K) + (r + 0.5 * sigma ** 2) * T) /
		(sigma * Math.sqrt(T));
	const d2 = d1 - sigma * Math.sqrt(T);
	const pdf = normalPDF(d1);
	const delta =
		type === "call"
			? normalCDF(d1)
			: normalCDF(d1) - 1;
	const gamma =
		pdf / (S * sigma * Math.sqrt(T));
	const vega =
		S * pdf * Math.sqrt(T);
	let theta;
	if (type === "call") {
		theta =
			-(S * pdf * sigma) / (2 * Math.sqrt(T)) -
			r * K * Math.exp(-r * T) * normalCDF(d2);
	} else {
		theta =
			-(S * pdf * sigma) / (2 * Math.sqrt(T)) +
			r * K * Math.exp(-r * T) * normalCDF(-d2);
	}
	return { delta, gamma, theta, vega };
}

export async function calculateGreeks(symbol: string): Promise<GreeksResult> {
	const cached = cache.getGreeks(symbol);
	if (cached) return cached;

	const data = await yahooFinance.options(symbol);
	if (!data || !data.options?.[0]) {
		throw new Error(`No option data for ${symbol}`);
	}
	const firstExpiry = data.options[0];
	const S = data.quote.regularMarketPrice;
	const T = timeToExpiry(firstExpiry.expirationDate);
	const r = 0.07;

	const calls = firstExpiry.calls
		.map(c => {
			const g = computeGreeks(S, c.strike, T, r, c.impliedVolatility ?? 0, "call");
			if (!g) return null;
			return { symbol: c.contractSymbol, strike: c.strike, ...g };
		})
		.filter((x): x is NonNullable<typeof x> => x !== null);

	const puts = firstExpiry.puts
		.map(p => {
			const g = computeGreeks(S, p.strike, T, r, p.impliedVolatility ?? 0, "put");
			if (!g) return null;
			return { symbol: p.contractSymbol, strike: p.strike, ...g };
		})
		.filter((x): x is NonNullable<typeof x> => x !== null);

	const result = {
		symbol,
		underlyingPrice: S,
		expiration: firstExpiry.expirationDate,
		calls,
		puts,
	};

	cache.setGreeks(symbol, result);
	return result;
}
