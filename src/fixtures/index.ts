import { test as baseTest, expect } from '@playwright/test';
import { ApiClient } from '@clients/ApiClient';
import { AuthService } from '@services/AuthService';
import { BookingService } from '@services/BookingService';
import { SchemaValidator } from '@validators/SchemaValidator';

/**
 * Fixture interface configuration mapping custom dependency injected parameters.
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
 * Extended Playwright test instance containing the framework's dependency injection container.
 * Tests import { test, expect } from this file to access these custom services.
 */
export const test = baseTest.extend<AppFixtures>({
  apiClient: async ({ request }, use) => {
    await use(new ApiClient(request));
  },
  authService: async ({ apiClient }, use) => {
    await use(new AuthService(apiClient));
  },
  bookingService: async ({ apiClient }, use) => {
    await use(new BookingService(apiClient));
  },
  schemaValidator: async ({}, use) => {
    await use(new SchemaValidator());
  },
});

export { expect };
