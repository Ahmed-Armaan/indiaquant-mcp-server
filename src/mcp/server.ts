import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getMarketPrice } from "../services/marketData.js";
import { getOptionChain } from "../services/optionsChain.js";
import { analyzeSentiment } from "../services/sentimentAnalysis.js";
import { calculatePortfolioPnL } from "../portfolio/pnl.js";
import { executeVirtualTrade } from "../portfolio/db.js";
import { generateTradeSignal } from "../services/signal.js";
import { getSectorHeatmap } from "../services/sectorHeatmap.js";
import { detectUnusualActivity } from "../services/unusualActivity.js";
import { calculateGreeks } from "../services/greeks.js";
import { scanMarket } from "../services/marketScanner.js";

export function CreateMcpServer() {
	const server = new McpServer({
		name: "indiaquant-mcp",
		version: "1.0.0",
	});

	server.registerTool(
		"get_live_price",
		{
			title: "Live Price",
			description: "Get the live market data of an NSE stock",
			inputSchema: {
				symbol: z.string(),
			},
		},
		async ({ symbol }) => {
			const result = await getMarketPrice(symbol);
			console.error(JSON.stringify(result))
			return {
				content: [{ type: "text" as const, text: JSON.stringify(result) }],
				isError: false,
			};
		}
	);


	server.registerTool(
		"get_options_chain",
		{
			title: "Options Chain for the stock",
			description: "Get the options chain data of an NSE stock",
			inputSchema: {
				symbol: z.string(),
				expiry: z.string().optional(),
			},
		},
		async ({ symbol, expiry }) => {
			const result = await getOptionChain(symbol, expiry);
			return {
				content: [{ type: "text" as const, text: JSON.stringify(result) }],
				isError: false,
			};
		}
	);


	server.registerTool(
		"analyze_sentiment",
		{
			title: "Sentiment Analysis",
			description: "Analyze news sentiment for a stock symbol",
			inputSchema: {
				symbol: z.string(),
			},
		},
		async ({ symbol }) => {
			const result = await analyzeSentiment(symbol);
			return {
				content: [{ type: "text" as const, text: JSON.stringify(result) }],
				isError: false,
			};
		}
	);


	server.registerTool(
		"generate_signal",
		{
			title: "Signal Generator",
			description: "Calculate confidence and generate a signal",
			inputSchema: {
				symbol: z.string(),
				frame: z.enum(["1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h", "1d", "5d", "1wk", "1mo", "3mo"]),
			},
		},
		async ({ symbol, frame }) => {
			const result = await generateTradeSignal(symbol, frame);
			return {
				content: [{ type: "text" as const, text: JSON.stringify(result) }],
				isError: false,
			};
		}
	);

	server.registerTool(
		"get_portfolio_pnl",
		{
			title: "Portfolio P&L",
			description: "Get current positions and total unrealized P&L",
			inputSchema: {},
		},
		async () => {
			try {
				const result = await calculatePortfolioPnL();
				return {
					content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
					isError: false,
				};
			} catch (error: any) {
				return {
					content: [{ type: "text", text: error.message }],
					isError: true,
				};
			}
		}
	);


	server.registerTool(
		"place_virtual_trade",
		{
			title: "Place Trade",
			description: "Execute a virtual buy or sell order at the current market price",
			inputSchema: {
				symbol: z.string(),
				qty: z.number().int().positive(),
				side: z.enum(["BUY", "SELL"]),
			},
		},
		async ({ symbol, qty, side }) => {
			try {
				const result = await executeVirtualTrade(symbol, qty, side);

				const summary = [
					`${side} Order Successful`,
					`Symbol: ${result.symbol}`,
					`Quantity: ${result.qty}`,
					`Execution Price: ₹${result.price.toFixed(2)}`,
					`Total Value: ₹${result.totalValue.toFixed(2)}`,
					`Remaining Cash: ₹${result.newCash.toFixed(2)}`
				].join("\n");

				return {
					content: [{ type: "text" as const, text: summary }],
					isError: false,
				};
			} catch (error: any) {
				return {
					content: [{ type: "text", text: `Trade Failed: ${error.message}` }],
					isError: true,
				};
			}
		}
	);

	server.registerTool(
		"calculate_greeks",
		{
			title: "Calculate Option Greeks",
			description:
				"Compute Delta, Gamma, Theta and Vega for all option contracts of a symbol using Black-Scholes",
			inputSchema: {
				symbol: z.string()
			}
		},
		async ({ symbol }) => {
			const result = await calculateGreeks(symbol);
			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify(result, null, 2)
					}
				],
				isError: false
			};

		}
	);

	server.registerTool(
		"detect_unusual_activity",
		{
			title: "Detect Unusual Options Activity",
			description: "Detect abnormal volume spikes in options trading",
			inputSchema: {
				symbol: z.string()
			}
		},
		async ({ symbol }) => {

			const result = await detectUnusualActivity(symbol);

			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify(result, null, 2)
					}
				],
				isError: false
			};
		}
	);

	server.registerTool(
		"scan_market",
		{
			title: "Market Scanner",
			description: "Scan Indian stocks using filters like RSI, sector, volume, or signal",
			inputSchema: {
				sector: z.enum(["IT", "BANKING", "ENERGY", "FMCG", "AUTO", "PHARMA"]).optional(),
				rsi_below: z.number().optional(),
				rsi_above: z.number().optional(),
				change_above: z.number().optional(),
				change_below: z.number().optional(),
				signal: z.enum(["BUY", "SELL", "HOLD"]).optional(),
				min_volume: z.number().optional()
			}
		},
		async (args) => {
			const result = await scanMarket(args);

			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify(result, null, 2)
					}
				],
				isError: false
			};
		}
	);

	server.registerTool(
		"get_sector_heatmap",
		{
			title: "Sector Heatmap",
			description: "Shows average percentage change per sector",
			inputSchema: {}
		},
		async () => {
			const result = await getSectorHeatmap();

			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify(result, null, 2)
					}
				],
				isError: false
			};
		}
	);

	return server;
}
