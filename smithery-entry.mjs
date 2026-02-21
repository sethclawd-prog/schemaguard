import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const createServer = require('./mcp-server.js');
export default createServer;
