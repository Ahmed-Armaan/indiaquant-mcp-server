import { yahooFinance } from "./utils/yahooFinance.js";

const SECTORS = {
	IT: ["TCS.NS", "INFY.NS", "WIPRO.NS", "HCLTECH.NS"],
	BANKING: ["HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS"],
	ENERGY: ["RELIANCE.NS", "ONGC.NS", "IOC.NS"],
	FMCG: ["HINDUNILVR.NS", "ITC.NS"]
};

export async function getSectorHeatmap() {
	const result: Record<string, number> = {};

	for (const [sector, symbols] of Object.entries(SECTORS)) {
		let total = 0;
		let count = 0;
		for (const symbol of symbols) {
			const quote = await yahooFinance.quote(symbol);
			if (quote.regularMarketChangePercent !== undefined) {
				total += quote.regularMarketChangePercent;
				count++;
			}
		}

		result[sector] = count > 0 ? total / count : 0;
	}

	return result;
}
