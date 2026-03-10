import { yahooFinance } from "./utils/yahooFinance.js";

export async function detectUnusualActivity(symbol: string) {
	const data = await yahooFinance.options(symbol);
	if (!data.options?.[0]) {
		throw new Error("No option chain");
	}

	const chain = data.options[0];
	const anomalies: any[] = [];
	for (const call of chain.calls) {
		if (!call.volume || !call.openInterest) continue;
		if (call.volume > call.openInterest * 2) {
			anomalies.push({
				type: "CALL_VOLUME_SPIKE",
				strike: call.strike,
				volume: call.volume,
				openInterest: call.openInterest
			});
		}
	}

	for (const put of chain.puts) {
		if (!put.volume || !put.openInterest) continue;
		if (put.volume > put.openInterest * 2) {
			anomalies.push({
				type: "PUT_VOLUME_SPIKE",
				strike: put.strike,
				volume: put.volume,
				openInterest: put.openInterest
			});
		}
	}

	return {
		symbol,
		alerts: anomalies.length,
		anomalies
	};
}
