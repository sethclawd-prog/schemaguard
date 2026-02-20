# SchemGuard — API Schema Drift Monitor

## What
CLI-first tool that detects breaking changes in OpenAPI specs. Runs in CI pipelines, alerts on drift.

## Core Features (MVP)
1. `schemaguard diff <old.yaml> <new.yaml>` — diff two OpenAPI specs, report breaking vs non-breaking changes
2. `schemaguard ci --spec ./openapi.yaml --baseline main` — CI mode, fails on breaking changes  
3. `schemaguard lint <spec.yaml>` — validate spec quality
4. JSON + human-readable output formats
5. Exit codes: 0 = no breaking, 1 = breaking changes, 2 = error

## Breaking Change Detection
- Removed endpoints
- Removed required request fields
- Changed field types
- Removed response fields
- Changed authentication requirements
- Narrowed enum values
- Changed URL paths

## Non-Breaking Changes (info only)
- Added endpoints
- Added optional request fields  
- Added response fields
- Widened enum values
- Added new auth options

## Tech Stack
- TypeScript + Node.js
- npm package (global installable)
- Zero external API dependencies
- Uses yaml parser + custom diff engine

## Package Structure
```
schemaguard/
├── src/
│   ├── cli.ts          — CLI entry point (commander.js)
│   ├── parser.ts       — OpenAPI spec parser
│   ├── differ.ts       — Diff engine (breaking vs non-breaking)
│   ├── reporter.ts     — Output formatting (human/json)
│   └── rules.ts        — Breaking change rule definitions
├── bin/
│   └── schemaguard     — CLI binary entry
├── tests/
│   ├── differ.test.ts
│   ├── parser.test.ts
│   └── fixtures/       — Sample OpenAPI specs for testing
├── package.json
├── tsconfig.json
├── openapi.yaml        — Our own API spec (meta!)
└── README.md
```

## Monetization (future)
- Free: CLI tool, local use
- Pro ($29/mo): CI integration, Slack alerts, changelog generation
- Team ($79/mo): Org-wide monitoring, agent API, webhook pipelines

## Build Target
Working CLI with diff + ci + lint commands. Tests passing. npm-installable.
