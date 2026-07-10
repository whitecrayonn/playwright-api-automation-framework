/**
 * JSON Schema for validation of the authentication response payload.
 */
export const AUTH_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    token: { type: 'string' },
  },
  required: ['token'],
  additionalProperties: false,
} as const;
