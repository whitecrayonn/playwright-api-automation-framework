import { test, expect } from '@playwright/test';
import { SchemaValidator } from '@validators/SchemaValidator';

/**
 * Pure unit tests for the AJV schema validation wrapper.
 * These run without any network access and exercise the error-mapping and
 * caching branches that integration tests leave uncovered.
 */
test.describe('SchemaValidator (unit) @unit', () => {
  const OBJECT_SCHEMA = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'integer' },
    },
    required: ['name', 'age'],
    additionalProperties: false,
  } as const;

  test('returns isValid true with no errors for conforming data', () => {
    const validator = new SchemaValidator();

    const result = validator.validate(OBJECT_SCHEMA, { name: 'Ada', age: 36 });

    expect(result.isValid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test('reports a descriptive error for a missing required property', () => {
    const validator = new SchemaValidator();

    const result = validator.validate(OBJECT_SCHEMA, { name: 'Ada' });

    expect(result.isValid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
    expect(result.errors!.some((e: string) => e.includes('age'))).toBe(true);
  });

  test('uses "(root)" as the path when the failing keyword has an empty instancePath', () => {
    const validator = new SchemaValidator();

    // A wrong root type produces an error with an empty instancePath.
    const result = validator.validate(OBJECT_SCHEMA, 'not-an-object');

    expect(result.isValid).toBe(false);
    expect(result.errors!.some((e: string) => e.startsWith('Path "(root)"'))).toBe(true);
  });

  test('aggregates every error when allErrors is enabled', () => {
    const validator = new SchemaValidator();

    // Both properties have the wrong type -> two distinct errors expected.
    const result = validator.validate(OBJECT_SCHEMA, { name: 42, age: 'old' });

    expect(result.isValid).toBe(false);
    expect(result.errors!.length).toBeGreaterThanOrEqual(2);
  });

  test('validates registered string formats such as date', () => {
    const dateSchema = {
      type: 'object',
      properties: { checkin: { type: 'string', format: 'date' } },
      required: ['checkin'],
    } as const;
    const validator = new SchemaValidator();

    expect(validator.validate(dateSchema, { checkin: '2026-07-13' }).isValid).toBe(true);
    expect(validator.validate(dateSchema, { checkin: 'not-a-date' }).isValid).toBe(false);
  });

  test('reuses the cached compiled validator for an identical schema', () => {
    const validator = new SchemaValidator();
    type Ajv = { compile: (...args: unknown[]) => unknown };
    const ajv = (validator as unknown as { ajv: Ajv }).ajv;
    const compileSpy = ajv.compile.bind(ajv);
    let compileCalls = 0;
    ajv.compile = (...args: unknown[]) => {
      compileCalls += 1;
      return compileSpy(...args);
    };

    validator.validate(OBJECT_SCHEMA, { name: 'Ada', age: 36 });
    validator.validate(OBJECT_SCHEMA, { name: 'Grace', age: 45 });

    expect(compileCalls).toBe(1);
  });
});
