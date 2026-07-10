/**
 * Shared type definitions for the API client layer.
 *
 * These types form the contract between the ApiClient, services, and tests.
 * Every HTTP interaction in the framework flows through these types.
 */

/**
 * Supported HTTP methods for API requests.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Options for configuring an individual API request.
 * All fields are optional — defaults are inherited from playwright.config.ts.
 */
export interface ApiRequestOptions {
  /** Additional headers merged with defaults from playwright.config.ts. */
  headers?: Record<string, string>;

  /** Query parameters appended to the request URL. */
  params?: Record<string, string | number | boolean | undefined>;

  /** Request body — automatically serialized to JSON by Playwright. */
  data?: unknown;

  /** Per-request timeout in milliseconds. Overrides the global timeout. */
  timeout?: number;
}

/**
 * Standardized response wrapper returned by every ApiClient method.
 * Provides a consistent contract for assertions across all tests and services.
 *
 * @template T - The expected shape of the parsed response body.
 *
 * @example
 * ```typescript
 * const response: ApiResponse<Booking> = await client.get<Booking>('/booking/1');
 * expect(response.status).toBe(200);
 * expect(response.body.firstname).toBe('John');
 * expect(response.responseTime).toBeLessThan(3000);
 * ```
 */
export interface ApiResponse<T = unknown> {
  /** HTTP status code (e.g., 200, 201, 404). */
  status: number;

  /** HTTP status text (e.g., 'OK', 'Created', 'Not Found'). */
  statusText: string;

  /** Response headers as key-value pairs. */
  headers: Record<string, string>;

  /** Parsed response body. JSON responses are auto-deserialized. */
  body: T;

  /** Round-trip response time in milliseconds. */
  responseTime: number;
}
