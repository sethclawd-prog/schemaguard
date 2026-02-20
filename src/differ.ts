/**
 * OpenAPI spec diff engine — detects breaking vs non-breaking changes.
 */

import { Change, RULES } from './rules';
import {
  OpenAPISpec,
  OperationObject,
  SchemaObject,
  getEndpoints,
  resolveSchema,
} from './parser';

export interface DiffResult {
  breaking: Change[];
  nonBreaking: Change[];
  totalChanges: number;
  hasBreakingChanges: boolean;
}

export function diffSpecs(oldSpec: OpenAPISpec, newSpec: OpenAPISpec): DiffResult {
  const changes: Change[] = [];

  diffEndpoints(oldSpec, newSpec, changes);
  diffSecurity(oldSpec, newSpec, changes);

  const breaking = changes.filter(c => c.kind === 'breaking');
  const nonBreaking = changes.filter(c => c.kind !== 'breaking');

  return {
    breaking,
    nonBreaking,
    totalChanges: changes.length,
    hasBreakingChanges: breaking.length > 0,
  };
}

function diffEndpoints(oldSpec: OpenAPISpec, newSpec: OpenAPISpec, changes: Change[]): void {
  const oldEndpoints = getEndpoints(oldSpec);
  const newEndpoints = getEndpoints(newSpec);

  // Check for removed endpoints
  for (const [endpoint] of oldEndpoints) {
    if (!newEndpoints.has(endpoint)) {
      changes.push({
        kind: 'breaking',
        path: endpoint,
        message: `Endpoint removed: ${endpoint}`,
        rule: RULES.ENDPOINT_REMOVED,
      });
    }
  }

  // Check for added endpoints
  for (const [endpoint] of newEndpoints) {
    if (!oldEndpoints.has(endpoint)) {
      changes.push({
        kind: 'non-breaking',
        path: endpoint,
        message: `Endpoint added: ${endpoint}`,
        rule: RULES.ENDPOINT_ADDED,
      });
    }
  }

  // Diff existing endpoints
  for (const [endpoint, oldOp] of oldEndpoints) {
    const newOp = newEndpoints.get(endpoint);
    if (newOp) {
      diffOperation(oldSpec, newSpec, endpoint, oldOp, newOp, changes);
    }
  }
}

function diffOperation(
  oldSpec: OpenAPISpec,
  newSpec: OpenAPISpec,
  endpoint: string,
  oldOp: OperationObject,
  newOp: OperationObject,
  changes: Change[]
): void {
  // Check deprecation
  if (!oldOp.deprecated && newOp.deprecated) {
    changes.push({
      kind: 'non-breaking',
      path: endpoint,
      message: `Endpoint deprecated: ${endpoint}`,
      rule: RULES.DEPRECATED,
    });
  }

  // Diff parameters
  diffParameters(endpoint, oldOp, newOp, changes);

  // Diff request body
  diffRequestBody(oldSpec, newSpec, endpoint, oldOp, newOp, changes);

  // Diff responses
  diffResponses(oldSpec, newSpec, endpoint, oldOp, newOp, changes);

  // Description changes
  if (oldOp.description !== newOp.description || oldOp.summary !== newOp.summary) {
    changes.push({
      kind: 'non-breaking',
      path: endpoint,
      message: `Description/summary changed for ${endpoint}`,
      rule: RULES.DESCRIPTION_CHANGED,
    });
  }
}

function diffParameters(
  endpoint: string,
  oldOp: OperationObject,
  newOp: OperationObject,
  changes: Change[]
): void {
  const oldParams = new Map((oldOp.parameters || []).map(p => [`${p.in}:${p.name}`, p]));
  const newParams = new Map((newOp.parameters || []).map(p => [`${p.in}:${p.name}`, p]));

  // Removed params
  for (const [key, param] of oldParams) {
    if (!newParams.has(key)) {
      changes.push({
        kind: 'breaking',
        path: `${endpoint} > param ${param.name}`,
        message: `Parameter removed: ${param.name} (${param.in})`,
        rule: RULES.PARAM_REMOVED,
      });
    }
  }

  // Added params
  for (const [key, param] of newParams) {
    if (!oldParams.has(key)) {
      if (param.required) {
        changes.push({
          kind: 'breaking',
          path: `${endpoint} > param ${param.name}`,
          message: `Required parameter added: ${param.name} (${param.in})`,
          rule: RULES.REQUIRED_PARAM_ADDED,
        });
      } else {
        changes.push({
          kind: 'non-breaking',
          path: `${endpoint} > param ${param.name}`,
          message: `Optional parameter added: ${param.name} (${param.in})`,
          rule: RULES.OPTIONAL_PARAM_ADDED,
        });
      }
    }
  }

  // Changed param types
  for (const [key, oldParam] of oldParams) {
    const newParam = newParams.get(key);
    if (newParam && oldParam.schema?.type && newParam.schema?.type) {
      if (oldParam.schema.type !== newParam.schema.type) {
        changes.push({
          kind: 'breaking',
          path: `${endpoint} > param ${oldParam.name}`,
          message: `Parameter type changed: ${oldParam.name} (${oldParam.schema.type} → ${newParam.schema.type})`,
          rule: RULES.FIELD_TYPE_CHANGED,
        });
      }
    }
  }
}

function diffRequestBody(
  oldSpec: OpenAPISpec,
  newSpec: OpenAPISpec,
  endpoint: string,
  oldOp: OperationObject,
  newOp: OperationObject,
  changes: Change[]
): void {
  const oldContent = oldOp.requestBody?.content?.['application/json'];
  const newContent = newOp.requestBody?.content?.['application/json'];

  if (!oldContent?.schema && !newContent?.schema) return;

  const oldSchema = resolveSchema(oldSpec, oldContent?.schema);
  const newSchema = resolveSchema(newSpec, newContent?.schema);

  if (oldSchema && newSchema) {
    diffSchema(oldSpec, newSpec, `${endpoint} > requestBody`, oldSchema, newSchema, changes, 'request');
  }
}

function diffResponses(
  oldSpec: OpenAPISpec,
  newSpec: OpenAPISpec,
  endpoint: string,
  oldOp: OperationObject,
  newOp: OperationObject,
  changes: Change[]
): void {
  const oldResponses = oldOp.responses || {};
  const newResponses = newOp.responses || {};

  // Removed response codes
  for (const code of Object.keys(oldResponses)) {
    if (!(code in newResponses)) {
      changes.push({
        kind: 'breaking',
        path: `${endpoint} > response ${code}`,
        message: `Response code removed: ${code}`,
        rule: RULES.RESPONSE_CODE_REMOVED,
      });
    }
  }

  // Added response codes
  for (const code of Object.keys(newResponses)) {
    if (!(code in oldResponses)) {
      changes.push({
        kind: 'non-breaking',
        path: `${endpoint} > response ${code}`,
        message: `Response code added: ${code}`,
        rule: RULES.RESPONSE_CODE_ADDED,
      });
    }
  }

  // Diff response schemas
  for (const code of Object.keys(oldResponses)) {
    if (code in newResponses) {
      const oldContent = oldResponses[code]?.content?.['application/json'];
      const newContent = newResponses[code]?.content?.['application/json'];

      const oldSchema = resolveSchema(oldSpec, oldContent?.schema);
      const newSchema = resolveSchema(newSpec, newContent?.schema);

      if (oldSchema && newSchema) {
        diffSchema(oldSpec, newSpec, `${endpoint} > response ${code}`, oldSchema, newSchema, changes, 'response');
      }
    }
  }
}

function diffSchema(
  oldSpec: OpenAPISpec,
  newSpec: OpenAPISpec,
  basePath: string,
  oldSchema: SchemaObject,
  newSchema: SchemaObject,
  changes: Change[],
  context: 'request' | 'response',
  depth: number = 0
): void {
  if (depth > 10) return; // Prevent circular ref loops

  // Type changed
  if (oldSchema.type && newSchema.type && oldSchema.type !== newSchema.type) {
    changes.push({
      kind: 'breaking',
      path: basePath,
      message: `Type changed: ${oldSchema.type} → ${newSchema.type}`,
      rule: RULES.FIELD_TYPE_CHANGED,
    });
    return;
  }

  // Enum changes
  if (oldSchema.enum && newSchema.enum) {
    const removed = oldSchema.enum.filter(v => !newSchema.enum!.includes(v));
    const added = newSchema.enum.filter(v => !oldSchema.enum!.includes(v));

    for (const v of removed) {
      changes.push({
        kind: 'breaking',
        path: basePath,
        message: `Enum value removed: ${JSON.stringify(v)}`,
        rule: RULES.ENUM_VALUE_REMOVED,
      });
    }
    for (const v of added) {
      changes.push({
        kind: 'non-breaking',
        path: basePath,
        message: `Enum value added: ${JSON.stringify(v)}`,
        rule: RULES.ENUM_VALUE_ADDED,
      });
    }
  }

  // Properties
  const oldProps = oldSchema.properties || {};
  const newProps = newSchema.properties || {};
  const oldRequired = new Set(oldSchema.required || []);
  const newRequired = new Set(newSchema.required || []);

  // Removed properties
  for (const prop of Object.keys(oldProps)) {
    if (!(prop in newProps)) {
      if (context === 'response') {
        changes.push({
          kind: 'breaking',
          path: `${basePath}.${prop}`,
          message: `Response field removed: ${prop}`,
          rule: RULES.RESPONSE_FIELD_REMOVED,
        });
      }
      // Removing a request field is non-breaking (less strict input)
    }
  }

  // Added properties
  for (const prop of Object.keys(newProps)) {
    if (!(prop in oldProps)) {
      if (context === 'request' && newRequired.has(prop)) {
        changes.push({
          kind: 'breaking',
          path: `${basePath}.${prop}`,
          message: `Required request field added: ${prop}`,
          rule: RULES.REQUEST_FIELD_REQUIRED,
        });
      } else if (context === 'response') {
        changes.push({
          kind: 'non-breaking',
          path: `${basePath}.${prop}`,
          message: `Response field added: ${prop}`,
          rule: RULES.RESPONSE_FIELD_ADDED,
        });
      }
    }
  }

  // Fields made required
  for (const prop of newRequired) {
    if (!oldRequired.has(prop) && prop in oldProps && context === 'request') {
      changes.push({
        kind: 'breaking',
        path: `${basePath}.${prop}`,
        message: `Field made required: ${prop}`,
        rule: RULES.REQUEST_FIELD_REQUIRED,
      });
    }
  }

  // Recurse into shared properties
  for (const prop of Object.keys(oldProps)) {
    if (prop in newProps) {
      const oldPropSchema = resolveSchema(oldSpec, oldProps[prop]);
      const newPropSchema = resolveSchema(newSpec, newProps[prop]);
      if (oldPropSchema && newPropSchema) {
        diffSchema(oldSpec, newSpec, `${basePath}.${prop}`, oldPropSchema, newPropSchema, changes, context, depth + 1);
      }
    }
  }
}

function diffSecurity(oldSpec: OpenAPISpec, newSpec: OpenAPISpec, changes: Change[]): void {
  const oldSchemes = Object.keys(oldSpec.components?.securitySchemes || {}).sort().join(',');
  const newSchemes = Object.keys(newSpec.components?.securitySchemes || {}).sort().join(',');

  if (oldSchemes !== newSchemes) {
    changes.push({
      kind: 'breaking',
      path: 'security',
      message: `Security schemes changed: [${oldSchemes}] → [${newSchemes}]`,
      rule: RULES.AUTH_CHANGED,
    });
  }
}
