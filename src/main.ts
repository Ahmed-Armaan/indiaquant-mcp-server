import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
//import { CreateMcpServer } from './mcp/server.js';
import { getMarketPrice } from './services/marketData.js';

//const server = CreateMcpServer();
//const transport = new StdioServerTransport();
//await server.connect(transport);

console.log('Executing');
getMarketPrice('AAPL')
