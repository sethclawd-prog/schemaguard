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

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const { parseSpec, lintSpec } = require('./dist/parser');
const { diffSpecs } = require('./dist/differ');
const { formatDiff, formatLint } = require('./dist/reporter');

function createServer() {
  const server = new McpServer({
    name: 'schemaguard',
    version: '0.1.3',
  });

  // Tool: schemaguard_diff
  server.tool(
    'schemaguard_diff',
    'Compare two OpenAPI specs and detect breaking vs non-breaking changes. Use when reviewing API changes, validating PRs that modify API specs, or checking backward compatibility.',
    {
      old_spec: z.string().describe('File path to the old/baseline OpenAPI spec (YAML or JSON)'),
      new_spec: z.string().describe('File path to the new/current OpenAPI spec (YAML or JSON)'),
      format: z.enum(['human', 'json']).optional().default('human').describe('Output format'),
    },
    async ({ old_spec, new_spec, format }) => {
      try {
        const oldSpec = parseSpec(old_spec);
        const newSpec = parseSpec(new_spec);
        const result = diffSpecs(oldSpec, newSpec);
        return { content: [{ type: 'text', text: formatDiff(result, format) }] };
      } catch (err) {
        return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
      }
    }
  );

  // Tool: schemaguard_lint
  server.tool(
    'schemaguard_lint',
    'Validate an OpenAPI spec for quality issues. Checks for missing operationIds, descriptions, security schemes, etc.',
    {
      spec: z.string().describe('File path to the OpenAPI spec to lint (YAML or JSON)'),
    },
    async ({ spec }) => {
      try {
        const parsed = parseSpec(spec);
        const issues = lintSpec(parsed);
        return { content: [{ type: 'text', text: formatLint(issues) }] };
      } catch (err) {
        return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
      }
    }
  );

  // Tool: schemaguard_check
  server.tool(
    'schemaguard_check',
    'CI-style check: compare spec against baseline and report if breaking changes exist. Returns a clear pass/fail verdict.',
    {
      spec: z.string().describe('File path to the current OpenAPI spec'),
      baseline: z.string().describe('File path to the baseline OpenAPI spec'),
    },
    async ({ spec, baseline }) => {
      try {
        const baselineSpec = parseSpec(baseline);
        const currentSpec = parseSpec(spec);
        const result = diffSpecs(baselineSpec, currentSpec);
        const output = formatDiff(result, 'human');
        const verdict = result.hasBreakingChanges
          ? `\n\n🚫 VERDICT: FAIL — ${result.breaking.length} breaking change(s) detected.`
          : `\n\n✅ VERDICT: PASS — ${result.totalChanges > 0 ? 'all changes are non-breaking' : 'no changes detected'}.`;
        return { content: [{ type: 'text', text: output + verdict }] };
      } catch (err) {
        return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
      }
    }
  );

  return server;
}

// CJS exports for direct use
module.exports = createServer;
module.exports.default = createServer;
module.exports.createServer = createServer;
module.exports.createSandboxServer = createServer;

// Run as stdio server when executed directly
if (require.main === module) {
  const server = createServer();
  const transport = new StdioServerTransport();
  server.connect(transport).then(() => {
    process.stderr.write('SchemGuard MCP server running on stdio\n');
  }).catch((err) => {
    process.stderr.write(`Failed to start: ${err.message}\n`);
    process.exit(1);
  });
}
