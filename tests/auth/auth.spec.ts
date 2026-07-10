import { test, expect } from '@fixtures/index';
import { AUTH_RESPONSE_SCHEMA } from '@schemas/auth.schema';
import { config } from '@config/config';

test.describe('Authentication API Tests @auth @regression', () => {
  test('should successfully generate an auth token with valid credentials', async ({
    authService,
    schemaValidator,
  }) => {
    const payload = {
      username: config.auth.username,
      password: config.auth.password,
    };

    const response = await authService.createToken(payload);

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.token.length).toBeGreaterThan(0);

    // Schema Validation
    const validationResult = schemaValidator.validate(
      AUTH_RESPONSE_SCHEMA,
      response.body,
    );
    expect(
      validationResult.isValid,
      `Auth response schema errors:\n${validationResult.errors?.join('\n')}`,
    ).toBe(true);
  });

  test('should return bad credentials response when submitting an invalid password', async ({
    authService,
  }) => {
    const payload = {
      username: config.auth.username,
      password: 'wrong_password_123',
    };

    // Restful Booker returns status 200 with text payload "Bad credentials" on fail
    const response = await authService.createToken(payload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ reason: 'Bad credentials' });
  });
});
