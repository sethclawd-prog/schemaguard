import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { parseSpec } from '../src/parser';
import { diffSpecs } from '../src/differ';
import { RULES } from '../src/rules';

const fixtures = path.join(__dirname, 'fixtures');

describe('diffSpecs', () => {
  it('should detect no changes when comparing same spec', () => {
    const spec = parseSpec(path.join(fixtures, 'v1.yaml'));
    const result = diffSpecs(spec, spec);

    expect(result.hasBreakingChanges).toBe(false);
    expect(result.totalChanges).toBe(0);
  });

  it('should detect breaking changes between v1 and v2-breaking', () => {
    const oldSpec = parseSpec(path.join(fixtures, 'v1.yaml'));
    const newSpec = parseSpec(path.join(fixtures, 'v2-breaking.yaml'));
    const result = diffSpecs(oldSpec, newSpec);

    expect(result.hasBreakingChanges).toBe(true);
    expect(result.breaking.length).toBeGreaterThan(0);

    const rules = result.breaking.map(c => c.rule);

    // DELETE /pets/{petId} was removed
    expect(rules).toContain(RULES.ENDPOINT_REMOVED);

    // Required param owner_id added to GET /pets
    expect(rules).toContain(RULES.REQUIRED_PARAM_ADDED);

    // petId type changed from string to integer
    expect(rules).toContain(RULES.FIELD_TYPE_CHANGED);

    // Enum value "bird" removed from species
    expect(rules).toContain(RULES.ENUM_VALUE_REMOVED);

    // "total" removed from response
    expect(rules).toContain(RULES.RESPONSE_FIELD_REMOVED);

    // Auth changed from ApiKey to BearerAuth
    expect(rules).toContain(RULES.AUTH_CHANGED);
  });

  it('should detect required request field added (owner_id)', () => {
    const oldSpec = parseSpec(path.join(fixtures, 'v1.yaml'));
    const newSpec = parseSpec(path.join(fixtures, 'v2-breaking.yaml'));
    const result = diffSpecs(oldSpec, newSpec);

    const reqFieldChanges = result.breaking.filter(c => c.rule === RULES.REQUEST_FIELD_REQUIRED);
    expect(reqFieldChanges.length).toBeGreaterThan(0);
    expect(reqFieldChanges.some(c => c.message.includes('owner_id'))).toBe(true);
  });

  it('should detect only non-breaking changes between v1 and v2-safe', () => {
    const oldSpec = parseSpec(path.join(fixtures, 'v1.yaml'));
    const newSpec = parseSpec(path.join(fixtures, 'v2-safe.yaml'));
    const result = diffSpecs(oldSpec, newSpec);

    expect(result.hasBreakingChanges).toBe(false);
    expect(result.nonBreaking.length).toBeGreaterThan(0);

    const rules = result.nonBreaking.map(c => c.rule);

    // New endpoint added
    expect(rules).toContain(RULES.ENDPOINT_ADDED);

    // Optional param added
    expect(rules).toContain(RULES.OPTIONAL_PARAM_ADDED);

    // Response field added (color, page)
    expect(rules).toContain(RULES.RESPONSE_FIELD_ADDED);

    // Enum value added (fish)
    expect(rules).toContain(RULES.ENUM_VALUE_ADDED);
  });

  it('should detect new endpoint as non-breaking', () => {
    const oldSpec = parseSpec(path.join(fixtures, 'v1.yaml'));
    const newSpec = parseSpec(path.join(fixtures, 'v2-safe.yaml'));
    const result = diffSpecs(oldSpec, newSpec);

    const addedEndpoints = result.nonBreaking.filter(c => c.rule === RULES.ENDPOINT_ADDED);
    expect(addedEndpoints.length).toBe(1);
    expect(addedEndpoints[0].path).toContain('/toys');
  });
});
