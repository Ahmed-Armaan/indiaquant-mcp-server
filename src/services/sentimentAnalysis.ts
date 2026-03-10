import type { SentimentResult } from "../types/services.js";
import { cache } from "../utils/cache.js";
import { positiveWords } from "./utils/sentimentWords.js";
import { negativeWords } from "./utils/sentimentWords.js";

const NEWS_API_KEY = process.env.NEWS_API_KEY;

function scoreHeadlines(headlines: string[]): number {
	let score = 0;
	let totalMatches = 0;

	for (const headline of headlines) {
		const lower = headline.toLowerCase();
		for (const word of positiveWords) {
			if (lower.includes(word)) { score += 1; totalMatches++; }
		}
		for (const word of negativeWords) {
			if (lower.includes(word)) { score -= 1; totalMatches++; }
		}
	}

	if (totalMatches === 0) return 0;
	return parseFloat((score / totalMatches).toFixed(2));
}

export async function analyzeSentiment(symbol: string): Promise<SentimentResult> {
	const cached = cache.getSentiment(symbol);
	if (cached) return cached;

	const url = `https://newsapi.org/v2/everything?q=${symbol}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`;
	const res = await fetch(url);
	const json = await res.json() as { articles: { title: string }[] };

	const headlines = (json.articles ?? []).map((a) => a.title).filter(Boolean);
	const score = scoreHeadlines(headlines);
	const signal: SentimentResult["signal"] = score > 0.2 ? "BUY" : score < -0.2 ? "SELL" : "NEUTRAL";

	const result: SentimentResult = { score, signal };
	cache.setSentiment(symbol, result);
	return result;
}
