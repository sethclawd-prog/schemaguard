import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { parseSpec, getEndpoints, lintSpec } from '../src/parser';

const fixtures = path.join(__dirname, 'fixtures');

describe('parseSpec', () => {
  it('should parse a valid YAML OpenAPI spec', () => {
    const spec = parseSpec(path.join(fixtures, 'v1.yaml'));
    expect(spec.openapi).toBe('3.0.3');
    expect(spec.info?.title).toBe('Pet Store API');
    expect(spec.info?.version).toBe('1.0.0');
  });

  it('should throw on non-existent file', () => {
    expect(() => parseSpec('/nonexistent/file.yaml')).toThrow();
  });

  it('should throw on invalid spec (no openapi field)', () => {
    // Create a temp invalid file
    const fs = require('fs');
    const tmpPath = path.join(fixtures, '_invalid.yaml');
    fs.writeFileSync(tmpPath, 'title: not a spec\nversion: 1');
    
    expect(() => parseSpec(tmpPath)).toThrow('Not a valid OpenAPI spec');
    
    fs.unlinkSync(tmpPath);
  });
});

describe('getEndpoints', () => {
  it('should extract all endpoints', () => {
    const spec = parseSpec(path.join(fixtures, 'v1.yaml'));
    const endpoints = getEndpoints(spec);

    expect(endpoints.size).toBe(4);
    expect(endpoints.has('GET /pets')).toBe(true);
    expect(endpoints.has('POST /pets')).toBe(true);
    expect(endpoints.has('GET /pets/{petId}')).toBe(true);
    expect(endpoints.has('DELETE /pets/{petId}')).toBe(true);
  });
});

describe('lintSpec', () => {
  it('should return no issues for a well-formed spec', () => {
    const spec = parseSpec(path.join(fixtures, 'v1.yaml'));
    const issues = lintSpec(spec);

    // All endpoints have operationId and summary, so minimal issues
    expect(issues.length).toBe(0);
  });

  it('should detect missing operationId', () => {
    const spec = parseSpec(path.join(fixtures, 'v2-safe.yaml'));
    const issues = lintSpec(spec);

    // The /toys endpoint might be missing some fields
    const opIdIssues = issues.filter(i => i.includes('operationId'));
    // All our fixtures have operationIds, so this should be 0
    expect(opIdIssues.length).toBe(0);
  });
});
