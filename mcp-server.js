#!/usr/bin/env node

/**
 * SchemGuard MCP Server
 * 
 * Model Context Protocol server that exposes SchemGuard as tools
 * for AI coding agents (Claude Code, Codex, OpenClaw, etc.)
 * 
 * Run: npx @sethclawd/schemaguard --mcp
 * Or:  node mcp-server.js
 */

const { parseSpec, lintSpec } = require('./dist/parser');
const { diffSpecs } = require('./dist/differ');
const { formatDiff, formatLint } = require('./dist/reporter');
const readline = require('readline');

const SERVER_INFO = {
  name: 'schemaguard',
  version: '0.1.0',
};

const TOOLS = [
  {
    name: 'schemaguard_diff',
    description: 'Compare two OpenAPI specs and detect breaking vs non-breaking changes. Use when reviewing API changes, validating PRs that modify API specs, or checking backward compatibility.',
    inputSchema: {
      type: 'object',
      properties: {
        old_spec: { type: 'string', description: 'File path to the old/baseline OpenAPI spec (YAML or JSON)' },
        new_spec: { type: 'string', description: 'File path to the new/current OpenAPI spec (YAML or JSON)' },
        format: { type: 'string', enum: ['human', 'json'], description: 'Output format', default: 'human' },
      },
      required: ['old_spec', 'new_spec'],
    },
  },
  {
    name: 'schemaguard_lint',
    description: 'Validate an OpenAPI spec for quality issues. Checks for missing operationIds, descriptions, security schemes, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        spec: { type: 'string', description: 'File path to the OpenAPI spec to lint (YAML or JSON)' },
      },
      required: ['spec'],
    },
  },
  {
    name: 'schemaguard_check',
    description: 'CI-style check: compare spec against baseline and report if breaking changes exist. Returns a clear pass/fail verdict.',
    inputSchema: {
      type: 'object',
      properties: {
        spec: { type: 'string', description: 'File path to the current OpenAPI spec' },
        baseline: { type: 'string', description: 'File path to the baseline OpenAPI spec' },
      },
      required: ['spec', 'baseline'],
    },
  },
];

function handleToolCall(name, args) {
  try {
    switch (name) {
      case 'schemaguard_diff': {
        const oldSpec = parseSpec(args.old_spec);
        const newSpec = parseSpec(args.new_spec);
        const result = diffSpecs(oldSpec, newSpec);
        const format = args.format || 'human';
        return { content: [{ type: 'text', text: formatDiff(result, format) }] };
      }
      case 'schemaguard_lint': {
        const spec = parseSpec(args.spec);
        const issues = lintSpec(spec);
        return { content: [{ type: 'text', text: formatLint(issues) }] };
      }
      case 'schemaguard_check': {
        const baseline = parseSpec(args.baseline);
        const current = parseSpec(args.spec);
        const result = diffSpecs(baseline, current);
        const output = formatDiff(result, 'human');
        const verdict = result.hasBreakingChanges
          ? `\n\n🚫 VERDICT: FAIL — ${result.breaking.length} breaking change(s) detected.`
          : `\n\n✅ VERDICT: PASS — ${result.totalChanges > 0 ? 'all changes are non-breaking' : 'no changes detected'}.`;
        return { content: [{ type: 'text', text: output + verdict }] };
      }
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (err) {
    return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
  }
}

// JSON-RPC over stdio
const rl = readline.createInterface({ input: process.stdin });
let buffer = '';

function send(msg) {
  const json = JSON.stringify(msg);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}`);
}

function handleMessage(msg) {
  const { id, method, params } = msg;

  switch (method) {
    case 'initialize':
      send({ jsonrpc: '2.0', id, result: { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: SERVER_INFO } });
      break;
    case 'notifications/initialized':
      break;
    case 'tools/list':
      send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
      break;
    case 'tools/call':
      const result = handleToolCall(params.name, params.arguments || {});
      send({ jsonrpc: '2.0', id, result });
      break;
    default:
      send({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } });
  }
}

// Parse Content-Length framed messages
process.stdin.on('data', (chunk) => {
  buffer += chunk.toString();
  while (true) {
    const headerEnd = buffer.indexOf('\r\n\r\n');
    if (headerEnd === -1) break;
    const header = buffer.substring(0, headerEnd);
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) break;
    const len = parseInt(match[1]);
    const bodyStart = headerEnd + 4;
    if (buffer.length < bodyStart + len) break;
    const body = buffer.substring(bodyStart, bodyStart + len);
    buffer = buffer.substring(bodyStart + len);
    try {
      handleMessage(JSON.parse(body));
    } catch (e) {
      // skip malformed
    }
  }
});

process.stderr.write('SchemGuard MCP server running on stdio\n');
