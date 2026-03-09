import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getMarketPrice } from "../services/marketData.js";

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
				symbol: z.string()
			},
			outputSchema: {
				price: z.number(),
				changePercentage: z.number(),
				volume: z.number()
			}
		},
		async ({ symbol }) => {
			const result = await getMarketPrice(symbol);
			return {
				content: [{ type: 'text', text: JSON.stringify(result) }],
			}
		}
	);

	return server;
}
