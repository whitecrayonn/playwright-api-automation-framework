import Ajv, { Schema, ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

/**
 * Reusable schema validator wrapper utilizing AJV.
 * Caches compiled validator functions to prevent redundant compilation overhead at scale.
 */
export class SchemaValidator {
  private readonly ajv: Ajv;
  private readonly cache = new Map<string, ValidateFunction>();

  constructor() {
    this.ajv = new Ajv({
      allErrors: true, // Report all validation errors rather than failing fast
      strict: false,   // Allow non-standard schemas if necessary
      verbose: true,
    });
    // Add format support (e.g. date-time, email, uri)
    addFormats(this.ajv);
  }

  /**
   * Validates target data object structure against the provided JSON schema.
   * Compiles and caches validation functions dynamically.
   *
   * @param schema - The JSON schema object or definition
   * @param data - The data structure under test
   * @returns Validation state holding boolean flag and list of descriptive error strings
   */
  validate(
    schema: Record<string, unknown> | Schema,
    data: unknown,
  ): { isValid: boolean; errors?: string[] } {
    const schemaKey = JSON.stringify(schema);
    let validateFn = this.cache.get(schemaKey);

    if (!validateFn) {
      validateFn = this.ajv.compile(schema);
      this.cache.set(schemaKey, validateFn);
    }

    const isValid = validateFn(data);

    if (isValid) {
      return { isValid: true };
    }

    const errors =
      validateFn.errors?.map((err) => {
        const path = err.instancePath || '(root)';
        const message = err.message || 'invalid type';
        return `Path "${path}" ${message}`;
      }) || ['Unknown validation error'];

    return { isValid: false, errors };
  }
}
