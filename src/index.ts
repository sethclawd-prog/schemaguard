/**
 * SchemGuard — API Schema Drift Monitor
 * Programmatic API for use as a library.
 */

export { parseSpec, lintSpec, getEndpoints, resolveSchema } from './parser';
export { diffSpecs } from './differ';
export { formatDiff, formatLint } from './reporter';
export type { OpenAPISpec, OperationObject, SchemaObject } from './parser';
export type { DiffResult } from './differ';
export type { Change, ChangeKind } from './rules';
export { RULES } from './rules';
