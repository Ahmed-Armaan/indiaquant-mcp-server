import { yahooFinance } from "./utils/yahooFinance.js";
import { analyzeSentiment } from "./sentimentAnalysis.js";
import type { SentimentResult } from "../types/services.js";
import type { SignalResult } from "../types/services.js";

const TIMEFRAME_SECONDS = new Map<string, number>([
	["1m", 60],
	["2m", 2 * 60],
	["5m", 5 * 60],
	["15m", 15 * 60],
	["30m", 30 * 60],
	["60m", 60 * 60],
	["90m", 90 * 60],
	["1h", 60 * 60],
	["1d", 24 * 60 * 60],
	["5d", 5 * 24 * 60 * 60],
	["1wk", 7 * 24 * 60 * 60],
	["1mo", 30 * 24 * 60 * 60],
	["3mo", 90 * 24 * 60 * 60],
]);

const WEIGHTS = {
	ema_cross: 0.20,
	rsi: 0.20,
	macd: 0.20,
	bbands: 0.15,
	volume: 0.10,
	sentiment: 0.15,
};

function calcEma(closes: number[], period: number): number[] {
	if (closes.length < period) return [];
	const k = 2 / (period + 1);
	const result: number[] = new Array(period - 1).fill(NaN);
	let prev = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
	result.push(prev);
	for (let i = period; i < closes.length; i++) {
		prev = (closes[i] ?? prev) * k + prev * (1 - k);
		result.push(prev);
	}
	return result;
}

function calcRsi(closes: number[], period = 14): number {
	if (closes.length < period + 1) return 50;
	let gains = 0, losses = 0;
	for (let i = closes.length - period; i < closes.length; i++) {
		const curr = closes[i] ?? 0;
		const prev = closes[i - 1] ?? 0;
		const diff = curr - prev;
		diff >= 0 ? (gains += diff) : (losses += Math.abs(diff));
	}
	const rs = gains / (losses || 0.0001);
	return parseFloat((100 - 100 / (1 + rs)).toFixed(2));
}

function calcMacd(closes: number[]): { macd: number; signal: number } {
	const ema12 = calcEma(closes, 12);
	const ema26 = calcEma(closes, 26);
	const macdLine = ema12.map((v, i) => v - (ema26[i] ?? 0)).filter((v) => !isNaN(v));
	const sigLine = calcEma(macdLine, 9);
	return {
		macd: parseFloat((macdLine.at(-1) ?? 0).toFixed(4)),
		signal: parseFloat((sigLine.at(-1) ?? 0).toFixed(4)),
	};
}

function calcBBands(closes: number[], period = 20): { upper: number; lower: number } {
	const slice = closes.slice(-period);
	const mid = slice.reduce((a, b) => a + b, 0) / period;
	const std = Math.sqrt(slice.reduce((a, b) => a + (b - mid) ** 2, 0) / period);
	return {
		upper: parseFloat((mid + 2 * std).toFixed(2)),
		lower: parseFloat((mid - 2 * std).toFixed(2)),
	};
}

function voteEma(closes: number[]): { vote: -1 | 0 | 1; ema20: number; ema50: number } {
	const ema20 = calcEma(closes, 20).at(-1)!;
	const ema50 = calcEma(closes, 50).at(-1)!;
	const vote: -1 | 0 | 1 =
		ema20 > ema50 * 1.001 ? 1 :
			ema20 < ema50 * 0.999 ? -1 : 0;
	return { vote, ema20: parseFloat(ema20.toFixed(2)), ema50: parseFloat(ema50.toFixed(2)) };
}

function voteRsi(closes: number[]): { vote: -1 | 0 | 1; rsi: number } {
	const rsi = calcRsi(closes);
	const vote: -1 | 0 | 1 = rsi < 35 ? 1 : rsi > 65 ? -1 : 0;
	return { vote, rsi };
}

function voteMacd(closes: number[]): { vote: -1 | 0 | 1; macd: number; signal: number } {
	const { macd, signal } = calcMacd(closes);
	const vote: -1 | 0 | 1 = macd > signal ? 1 : macd < signal ? -1 : 0;
	return { vote, macd, signal };
}

function voteBBands(closes: number[], price: number): { vote: -1 | 0 | 1; upper: number; lower: number } {
	const { upper, lower } = calcBBands(closes);
	const vote: -1 | 0 | 1 = price <= lower ? 1 : price >= upper ? -1 : 0;
	return { vote, upper, lower };
}

function voteVolume(volumes: number[]): -1 | 0 | 1 {
	const avg = volumes.slice(0, -1).reduce((a, b) => a + b, 0) / (volumes.length - 1);
	const last = volumes.at(-1)!;
	return last > avg * 1.5 ? 1 : last < avg * 0.5 ? -1 : 0;
}

function voteSentiment(s: SentimentResult): -1 | 0 | 1 {
	return s.signal === "BUY" ? 1 : s.signal === "SELL" ? -1 : 0;
}

async function fetchOHLCV(symbol: string, frame: string) {
	const seconds = TIMEFRAME_SECONDS.get(frame) ?? 90 * 24 * 60 * 60; // defaults to 90 days

	const history = await yahooFinance.chart(symbol, {
		period1: new Date(Date.now() - seconds * 1000),
		period2: new Date(Date.now()),
	});

	const quotes = history.quotes.filter(
		(q) => q.close !== null && q.volume !== null && q.volume > 0
	);

	const closes = quotes.map((q) => q.close!);
	const volumes = quotes.map((q) => q.volume!);
	const price = closes.at(-1)!;

	if (closes.length < 30)
		throw new Error(`Not enough data for ${symbol}: got ${closes.length} candles, need 30+`);

	return { closes, volumes, price };
}

export async function generateTradeSignal(symbol: string, frame: string): Promise<SignalResult> {
	const { closes, volumes, price } = await fetchOHLCV(symbol, frame);

	const ema = voteEma(closes);
	const rsi = voteRsi(closes);
	const macd = voteMacd(closes);
	const bb = voteBBands(closes, price);
	const volVote = voteVolume(volumes);
	const sentiment = await analyzeSentiment(symbol);
	const sentVote = voteSentiment(sentiment);

	const breakdown = {
		ema_cross: ema.vote,
		rsi: rsi.vote,
		macd: macd.vote,
		bbands: bb.vote,
		volume: volVote,
		sentiment: sentVote,
	}

	const score =
		breakdown.ema_cross * WEIGHTS.ema_cross +
		breakdown.rsi * WEIGHTS.rsi +
		breakdown.macd * WEIGHTS.macd +
		breakdown.bbands * WEIGHTS.bbands +
		breakdown.volume * WEIGHTS.volume +
		breakdown.sentiment * WEIGHTS.sentiment;

	const signal: SignalResult["signal"] =
		score > 0.15 ? "BUY" :
			score < -0.15 ? "SELL" : "HOLD";

	return {
		symbol,
		signal,
		confidence: Math.round(Math.abs(score) * 100),
	};
}
