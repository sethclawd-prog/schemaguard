# SchemGuard — Agent Integration Guide

## For Claude Code / Codex / OpenClaw / Any MCP-Compatible Agent

### MCP Server Setup

Add SchemGuard as a tool server in your agent config:

**Claude Code** (`~/.claude/settings.json`):
```json
{
  "mcpServers": {
    "schemaguard": {
      "command": "node",
      "args": ["/path/to/node_modules/@sethclawd/schemaguard/mcp-server.js"]
    }
  }
}
```

**Or project-level** (`.claude/settings.json` in repo root):
```json
{
  "mcpServers": {
    "schemaguard": {
      "command": "npx",
      "args": ["@sethclawd/schemaguard", "--mcp"]
    }
  }
}
```

### Available Tools

Once connected, agents get three tools:

| Tool | When to Use |
|------|-------------|
| `schemaguard_diff` | Comparing two OpenAPI specs — shows breaking vs safe changes |
| `schemaguard_lint` | Validating spec quality — missing fields, security, etc. |
| `schemaguard_check` | CI-style pass/fail — "is this safe to deploy?" |

### Direct CLI Usage (No MCP)

Agents can also shell out directly:

```bash
# Diff two specs
npx @sethclawd/schemaguard diff old.yaml new.yaml

# CI check
npx @sethclawd/schemaguard ci --spec ./openapi.yaml --baseline ./baseline.yaml

# Lint
npx @sethclawd/schemaguard lint ./openapi.yaml

# JSON output (machine-readable)
npx @sethclawd/schemaguard diff old.yaml new.yaml --format json
```

### When Should Agents Use This?

- Before committing changes to an OpenAPI spec
- When reviewing PRs that modify API routes
- After generating/updating OpenAPI specs from code
- Before deploying API changes to production
- When validating that a migration maintains backward compatibility

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | No breaking changes (safe) |
| 1 | Breaking changes detected (blocked) |
| 2 | Error (invalid spec, file not found) |
