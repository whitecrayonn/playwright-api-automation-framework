import { Schema } from 'ajv';
import { expect } from '@fixtures/index';
import { SchemaValidator } from '@validators/SchemaValidator';

/**
 * Asserts that data conforms to a JSON schema, surfacing AJV error details in
 * the failure message. Consolidates the validate-then-expect pattern shared by
 * every schema-checking test.
 *
 * @param schemaValidator - AJV-backed validator
 * @param schema - Schema to validate against
 * @param data - Data under test
 * @param label - Human-readable prefix for the failure message
 */
export function expectValidSchema(
  schemaValidator: SchemaValidator,
  schema: Schema,
  data: unknown,
  label = 'Schema',
): void {
  const validationResult = schemaValidator.validate(schema, data);
  expect(
    validationResult.isValid,
    `${label} errors:\n${validationResult.errors?.join('\n')}`,
  ).toBe(true);
}
