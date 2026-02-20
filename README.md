# SchemGuard

**API Schema Drift Monitor** — detect breaking changes in OpenAPI specs before they break your consumers.

[![npm version](https://img.shields.io/npm/v/schemaguard)](https://www.npmjs.com/package/schemaguard)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Why

APIs break silently. A field gets renamed, an endpoint gets removed, an enum value disappears — and downstream consumers break in production. SchemGuard catches these before deploy.

## Install

```bash
npm install -g schemaguard
```

## Usage

### Diff two specs

```bash
schemaguard diff old-api.yaml new-api.yaml
```

Output:
```
Found 11 change(s):

❌ BREAKING CHANGES (9):
──────────────────────────────────────────────────
  ⛔ [endpoint-removed]
     Endpoint removed: DELETE /pets/{petId}
     at: DELETE /pets/{petId}

  ⛔ [field-type-changed]
     Parameter type changed: petId (string → integer)
     at: GET /pets/{petId} > param petId
  ...

🚨 9 breaking change(s) detected — deployment blocked.
```

### CI mode

```bash
schemaguard ci --spec ./openapi.yaml --baseline ./main-openapi.yaml
```

- Exit `0` = no breaking changes, safe to deploy
- Exit `1` = breaking changes detected, blocks the pipeline
- Exit `2` = error (invalid spec, file not found)

### Lint a spec

```bash
schemaguard lint ./openapi.yaml
```

Checks for missing `operationId`, missing descriptions, no security schemes, etc.

### JSON output

```bash
schemaguard diff old.yaml new.yaml --format json
```

Returns structured JSON for programmatic consumption by agents and CI tools.

## What it detects

### Breaking changes (exit code 1)
| Rule | Description |
|------|-------------|
| `endpoint-removed` | An endpoint was deleted |
| `method-removed` | An HTTP method was removed from a path |
| `required-param-added` | A new required parameter was added |
| `param-removed` | An existing parameter was removed |
| `request-field-made-required` | A request field became required |
| `field-type-changed` | A field's type was changed |
| `response-field-removed` | A response field was removed |
| `enum-value-removed` | An enum value was narrowed |
| `auth-requirement-changed` | Security schemes were modified |
| `response-code-removed` | A response status code was removed |

### Non-breaking changes (info only)
| Rule | Description |
|------|-------------|
| `endpoint-added` | A new endpoint was added |
| `optional-param-added` | A new optional parameter was added |
| `response-field-added` | A new response field was added |
| `enum-value-added` | An enum value was widened |
| `description-changed` | Description or summary text changed |
| `deprecated` | An endpoint was marked as deprecated |

## GitHub Actions

```yaml
- name: Check API compatibility
  run: npx schemaguard ci --spec ./openapi.yaml --baseline ./baseline.yaml
```

## Programmatic API

```typescript
import { parseSpec, diffSpecs, formatDiff } from 'schemaguard';

const oldSpec = parseSpec('./v1.yaml');
const newSpec = parseSpec('./v2.yaml');
const result = diffSpecs(oldSpec, newSpec);

if (result.hasBreakingChanges) {
  console.log(`${result.breaking.length} breaking changes found`);
}
```

## License

MIT
