/**
 * Breaking change rule definitions for OpenAPI spec diffing.
 */

export type ChangeKind = 'breaking' | 'non-breaking' | 'info';

export interface Change {
  kind: ChangeKind;
  path: string;
  message: string;
  rule: string;
}

export const RULES = {
  // Breaking changes
  ENDPOINT_REMOVED: 'endpoint-removed',
  METHOD_REMOVED: 'method-removed',
  REQUIRED_PARAM_ADDED: 'required-param-added',
  PARAM_REMOVED: 'param-removed',
  REQUEST_FIELD_REQUIRED: 'request-field-made-required',
  FIELD_TYPE_CHANGED: 'field-type-changed',
  RESPONSE_FIELD_REMOVED: 'response-field-removed',
  ENUM_VALUE_REMOVED: 'enum-value-removed',
  AUTH_CHANGED: 'auth-requirement-changed',
  RESPONSE_CODE_REMOVED: 'response-code-removed',
  
  // Non-breaking changes
  ENDPOINT_ADDED: 'endpoint-added',
  OPTIONAL_PARAM_ADDED: 'optional-param-added',
  RESPONSE_FIELD_ADDED: 'response-field-added',
  ENUM_VALUE_ADDED: 'enum-value-added',
  DESCRIPTION_CHANGED: 'description-changed',
  RESPONSE_CODE_ADDED: 'response-code-added',
  DEPRECATED: 'deprecated',
} as const;
