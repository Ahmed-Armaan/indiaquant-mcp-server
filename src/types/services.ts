export interface MarketData {
	price: number;
	changePercentage: number;
	volume: number;
}

export interface OptionsChainData {
	calls: { strike: number; oi: number }[];
	puts: { strike: number; oi: number }[];
}

export interface SentimentResult {
	score: number;
	signal: "BUY" | "SELL" | "NEUTRAL";
}

export interface SignalResult {
	symbol: string;
	//timeframe: string;
	signal: "BUY" | "SELL" | "HOLD";
	confidence: number;
	//breakdown: {
	//	ema_cross: -1 | 0 | 1;
	//	rsi: -1 | 0 | 1;
	//	macd: -1 | 0 | 1;
	//	bbands: -1 | 0 | 1;
	//	volume: -1 | 0 | 1;
	//	sentiment: -1 | 0 | 1;
	//};
	//indicators: {
	//	rsi: number;
	//	macd: number;
	//	macd_signal: number;
	//	ema20: number;
	//	ema50: number;
	//	bb_upper: number;
	//	bb_lower: number;
	//	sentiment_score: number;
	//};
}

export type Sector = "IT" | "BANKING" | "ENERGY" | "FMCG" | "AUTO" | "PHARMA";

export interface ScanFilter {
	sector?: Sector | undefined;
	rsi_below?: number | undefined;
	rsi_above?: number | undefined;
	change_above?: number | undefined;
	change_below?: number | undefined;
	signal?: string | undefined;
	min_volume?: number | undefined;
}

export interface ScanResult {
	symbol: string;
	price: number;
	change: number;
	rsi: number;
	volume: number;
	signal?: string;
}


export interface OptionGreeks {
	symbol: string;   // contract symbol e.g. "RELIANCE251225C1400"
	strike: number;
	delta: number;
	gamma: number;
	theta: number;
	vega: number;
}

export interface GreeksResult {
	symbol: string;
	underlyingPrice: number;
	expiration: Date;
	calls: OptionGreeks[];
	puts: OptionGreeks[];
}
