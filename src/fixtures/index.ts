import { test as baseTest, expect, request as pfRequest } from '@playwright/test';
import { ApiClient } from '@clients/ApiClient';
import { AuthService } from '@services/AuthService';
import { BookingService } from '@services/BookingService';
import { SchemaValidator } from '@validators/SchemaValidator';
import { config } from '@config/config';

/**
 * Lightweight best-effort automated cleanup registry.
 * Collects execution closures during tests and guarantees execution in FILO sequence upon teardown.
 */
export class CleanupRegistry {
  private readonly tasks: (() => Promise<unknown>)[] = [];

  /**
   * Registers a cleanup operation closure to be deferred until test completion.
   */
  defer(task: () => Promise<unknown>): void {
    this.tasks.push(task);
  }

  /**
   * Iterates through the registered tasks stack in FILO order.
   * Aggregates unhandled failures and filters out expected HTTP 404 states.
   */
  async runCleanup(): Promise<void> {
    const failures: Error[] = [];

    while (this.tasks.length > 0) {
      const task = this.tasks.pop();
      if (!task) continue;

      try {
        const result = await task();

        // Evaluate returned framework ApiResponse wrappers for non-exception failures
        if (result && typeof result === 'object' && 'status' in result) {
          const status = (result as { status: number }).status;
          if (status >= 400 && status !== 404) {
            const statusText = 'statusText' in result ? (result as { statusText: string }).statusText : '';
            failures.push(new Error(`Cleanup task failed with HTTP status ${status} ${statusText}`));
          }
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        const is404 = err.message.includes('404') || ('status' in err && (err as { status: unknown }).status === 404);
        if (!is404) {
          failures.push(err);
        }
      }
    }

    if (failures.length > 0) {
      const summary = failures.map((f, index) => `  [Failure ${index + 1}]: ${f.message}`).join('\n');
      throw new Error(`CleanupRegistry encountered ${failures.length} failure(s) during teardown:\n${summary}`);
    }
  }
}

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

  /** Test-scoped automated cleanup utility registry */
  cleanup: CleanupRegistry;
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
  cleanup: async ({ }, use) => {
    const registry = new CleanupRegistry();
    await use(registry);
    await registry.runCleanup();
  },
});

export { expect };