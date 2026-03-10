export interface Position {
	symbol: string;
	qty: number;
	avgPrice: number;
}

export interface Trade {
	symbol: string;
	qty: number;
	side: "BUY" | "SELL";
	price: number;
	timestamp?: string;
}

export interface PortfolioPnL {
	positions: {
		symbol: string;
		qty: number;
		avgPrice: number;
		marketPrice: number;
		unrealizedPnL: number;
	}[];
	totalUnrealizedPnL: number;
	cash: number;
}
