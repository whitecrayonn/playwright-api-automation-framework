import { test as baseTest, expect, request as pfRequest } from '@playwright/test';
import { ApiClient } from '@clients/ApiClient';
import { AuthService } from '@services/AuthService';
import { BookingService } from '@services/BookingService';
import { SchemaValidator } from '@validators/SchemaValidator';
import { config } from '@config/config';

/**
 * Fixture interface configuration mapping custom dependency injected parameters (Test Scoped).
 */
export interface AppFixtures {
  /** Reusable HTTP transport layer client */
  apiClient: ApiClient;

  /** AuthService handling JWT token operations */
  authService: AuthService;

  /** BookingService containing CRUD REST operations */
  bookingService: BookingService;

  /** AJV Response schema validator */
  schemaValidator: SchemaValidator;
}

/**
 * Fixture interface configuration mapping global execution parameters (Worker Scoped).
 */
export interface AppWorkerFixtures {
  /** Stateless, cached authorization token allocated once per execution thread worker */
  workerToken: string;
}

/**
 * Extended Playwright test instance containing the framework's dependency injection container.
 * Tests import { test, expect } from this file to access both test and worker-scoped services.
 */
export const test = baseTest.extend<AppFixtures, AppWorkerFixtures>({
  // Initialize the worker-level token isolation boundary
  workerToken: [async ({ }, use) => {
    // Spin up an isolated, worker-scoped standalone request context mapping to configuration baselines
    const requestContext = await pfRequest.newContext({ baseURL: config.api.baseUrl });
    const apiClient = new ApiClient(requestContext);
    const authService = new AuthService(apiClient);

    const authResponse = await authService.createToken({
      username: config.auth.username,
      password: config.auth.password,
    });

    // Provide the compiled token string to all downstream test execution hooks
    await use(authResponse.body.token);

    // Gracefully tear down the standalone network context upon worker thread termination
    await requestContext.dispose();
  }, { scope: 'worker' }],

  apiClient: async ({ request }, use) => {
    await use(new ApiClient(request));
  },
  authService: async ({ apiClient }, use) => {
    await use(new AuthService(apiClient));
  },
  bookingService: async ({ apiClient }, use) => {
    await use(new BookingService(apiClient));
  },
  schemaValidator: async ({ }, use) => {
    await use(new SchemaValidator());
  },
});

export { expect };