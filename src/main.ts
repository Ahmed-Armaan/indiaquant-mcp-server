import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CreateMcpServer } from './mcp/server.js';
import { dbInit } from './portfolio/db.js';

dbInit();
const server = CreateMcpServer();
const transport = new StdioServerTransport();
await server.connect(transport);
