import { getPositions, getCash } from "../portfolio/db.js";
import { getMarketPrice } from "../services/marketData.js";
import type { PortfolioPnL } from "./types.js";

export async function calculatePortfolioPnL(): Promise<PortfolioPnL> {
	const positions = getPositions();
	const cash = getCash();
	let totalUnrealizedPnL = 0;

	const detailedPositions = await Promise.all(
		positions.map(async (pos) => {
			const marketData = await getMarketPrice(pos.symbol);
			const marketPrice = marketData.price;

			const pnl = (marketPrice - pos.avgPrice) * pos.qty;
			totalUnrealizedPnL += pnl;

			return {
				symbol: pos.symbol,
				qty: pos.qty,
				avgPrice: pos.avgPrice,
				marketPrice,
				unrealizedPnL: pnl
			};
		})
	);

	return {
		positions: detailedPositions,
		totalUnrealizedPnL,
		cash
	};
}
