/**
 * OpenAPI spec parser — loads and normalizes YAML/JSON specs.
 */

import * as fs from 'fs';
import * as yaml from 'js-yaml';

export interface OpenAPISpec {
  openapi?: string;
  swagger?: string;
  info?: { title?: string; version?: string };
  paths?: Record<string, PathItem>;
  components?: { schemas?: Record<string, SchemaObject>; securitySchemes?: Record<string, any> };
  security?: SecurityRequirement[];
}

export interface PathItem {
  [method: string]: OperationObject | any;
}

export interface OperationObject {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses?: Record<string, ResponseObject>;
  security?: SecurityRequirement[];
  deprecated?: boolean;
}

export interface ParameterObject {
  name: string;
  in: string;
  required?: boolean;
  schema?: SchemaObject;
  description?: string;
}

export interface RequestBodyObject {
  required?: boolean;
  content?: Record<string, MediaTypeObject>;
}

export interface MediaTypeObject {
  schema?: SchemaObject;
}

export interface ResponseObject {
  description?: string;
  content?: Record<string, MediaTypeObject>;
}

export interface SchemaObject {
  type?: string;
  properties?: Record<string, SchemaObject>;
  required?: string[];
  items?: SchemaObject;
  enum?: any[];
  $ref?: string;
  allOf?: SchemaObject[];
  oneOf?: SchemaObject[];
  anyOf?: SchemaObject[];
}

export type SecurityRequirement = Record<string, string[]>;

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'];

export function parseSpec(filePath: string): OpenAPISpec {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  let spec: OpenAPISpec;
  if (filePath.endsWith('.json')) {
    spec = JSON.parse(content);
  } else {
    spec = yaml.load(content) as OpenAPISpec;
  }

  if (!spec) {
    throw new Error(`Failed to parse spec: ${filePath}`);
  }

  if (!spec.openapi && !spec.swagger) {
    throw new Error(`Not a valid OpenAPI spec (missing openapi/swagger version): ${filePath}`);
  }

  return spec;
}

export function getEndpoints(spec: OpenAPISpec): Map<string, OperationObject> {
  const endpoints = new Map<string, OperationObject>();
  
  if (!spec.paths) return endpoints;

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const method of HTTP_METHODS) {
      if (pathItem[method]) {
        endpoints.set(`${method.toUpperCase()} ${path}`, pathItem[method] as OperationObject);
      }
    }
  }

  return endpoints;
}

export function resolveRef(spec: OpenAPISpec, ref: string): SchemaObject | undefined {
  if (!ref.startsWith('#/')) return undefined;
  
  const parts = ref.replace('#/', '').split('/');
  let current: any = spec;
  
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  
  return current as SchemaObject;
}

export function resolveSchema(spec: OpenAPISpec, schema: SchemaObject | undefined): SchemaObject | undefined {
  if (!schema) return undefined;
  if (schema.$ref) return resolveRef(spec, schema.$ref);
  return schema;
}

export function lintSpec(spec: OpenAPISpec): string[] {
  const issues: string[] = [];

  if (!spec.info?.title) issues.push('Missing info.title');
  if (!spec.info?.version) issues.push('Missing info.version');
  if (!spec.paths || Object.keys(spec.paths).length === 0) issues.push('No paths defined');

  const endpoints = getEndpoints(spec);
  for (const [endpoint, op] of endpoints) {
    if (!op.responses || Object.keys(op.responses).length === 0) {
      issues.push(`${endpoint}: No responses defined`);
    }
    if (!op.operationId) {
      issues.push(`${endpoint}: Missing operationId`);
    }
    if (!op.summary && !op.description) {
      issues.push(`${endpoint}: Missing summary/description`);
    }
  }

  if (!spec.components?.securitySchemes && !spec.security) {
    issues.push('No security schemes defined');
  }

  return issues;
}
