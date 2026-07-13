import { APIRequestContext, APIResponse } from '@playwright/test';
import { ApiRequestOptions, ApiResponse, HttpMethod } from '@app-types/api.types';
import { config } from '@config/config';

/**
 * Centralized HTTP client for all API interactions.
 *
 * This is the **single entry point** for executing HTTP requests in the framework.
 * Services compose this client rather than calling Playwright's APIRequestContext directly.
 *
 * Implements:
 * - Observability: Request and response logging (method, URL, headers, payload, status, latency)
 * - Session State: Dynamic client-level authentication token caching to avoid repeated parameter passing
 */
export class ApiClient {
  private authToken?: string;

  constructor(private readonly request: APIRequestContext) {}

  /**
   * Set the session authentication token.
   * Subsequent requests will automatically include this token as a Cookie header.
   */
  setToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Clear the session authentication token.
   */
  clearToken(): void {
    this.authToken = undefined;
  }

  /**
   * Send a GET request.
   */
  async get<T = unknown>(
    endpoint: string,
    options?: Omit<ApiRequestOptions, 'data'>,
  ): Promise<ApiResponse<T>> {
    return this.send<T>('GET', endpoint, options);
  }

  /**
   * Send a POST request.
   */
  async post<T = unknown>(
    endpoint: string,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.send<T>('POST', endpoint, options);
  }

  /**
   * Send a PUT request.
   */
  async put<T = unknown>(
    endpoint: string,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.send<T>('PUT', endpoint, options);
  }

  /**
   * Send a PATCH request.
   */
  async patch<T = unknown>(
    endpoint: string,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.send<T>('PATCH', endpoint, options);
  }

  /**
   * Send a DELETE request.
   */
  async delete<T = unknown>(
    endpoint: string,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.send<T>('DELETE', endpoint, options);
  }

  /* ──────────────────────────────────────────────
   * Private Implementation
   * ────────────────────────────────────────────── */

  private async send<T>(
    method: HttpMethod,
    endpoint: string,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>> {
    const requestOptions = this.buildRequestOptions(options);
    const resolvedUrl = endpoint.startsWith('http')
      ? endpoint
      : `${config.api.baseUrl}${endpoint}`;

    this.logRequest(method, resolvedUrl, requestOptions);

    const startTime = Date.now();
    const response = await this.dispatch(method, endpoint, requestOptions);
    const responseTime = Date.now() - startTime;

    const apiResponse = await this.buildApiResponse<T>(response, responseTime);

    this.logResponse(
      apiResponse.status,
      apiResponse.statusText,
      apiResponse.headers,
      apiResponse.body,
      responseTime,
    );

    return apiResponse;
  }

  private buildRequestOptions(
    options?: ApiRequestOptions,
  ): Record<string, unknown> {
    const requestOptions: Record<string, unknown> = {};
    const headers: Record<string, string> = { ...options?.headers };

    // Inject token if present at client session level and not overridden by local options
    if (this.authToken && !headers['Cookie'] && !headers['cookie']) {
      headers['Cookie'] = `token=${this.authToken}`;
    }

    if (Object.keys(headers).length > 0) {
      requestOptions.headers = headers;
    }
    if (options?.params) requestOptions.params = options.params;
    if (options?.data !== undefined) requestOptions.data = options.data;
    if (options?.timeout) requestOptions.timeout = options.timeout;

    return requestOptions;
  }

  private async dispatch(
    method: HttpMethod,
    endpoint: string,
    options: Record<string, unknown>,
  ): Promise<APIResponse> {
    switch (method) {
      case 'GET':
        return this.request.get(endpoint, options);
      case 'POST':
        return this.request.post(endpoint, options);
      case 'PUT':
        return this.request.put(endpoint, options);
      case 'PATCH':
        return this.request.patch(endpoint, options);
      case 'DELETE':
        return this.request.delete(endpoint, options);
      default: {
        const exhaustiveCheck: never = method;
        throw new Error(
          `ApiClient received an unsupported HTTP method: "${String(exhaustiveCheck)}"`,
        );
      }
    }
  }

  private async buildApiResponse<T>(
    response: APIResponse,
    responseTime: number,
  ): Promise<ApiResponse<T>> {
    return {
      status: response.status(),
      statusText: response.statusText(),
      headers: response.headers(),
      body: await this.parseBody<T>(response),
      responseTime,
    };
  }

  private async parseBody<T>(response: APIResponse): Promise<T> {
    const text = await response.text();

    if (!text) {
      return null as unknown as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch (error) {
      // A body that advertises JSON but fails to parse indicates a real
      // problem (truncated payload, upstream error page, etc.). Surface it
      // instead of silently masking it, while still falling back to the raw
      // text so genuinely non-JSON endpoints keep working.
      const contentType = response.headers()['content-type'] ?? '';
      if (contentType.toLowerCase().includes('json')) {
        const reason = error instanceof Error ? error.message : String(error);
        console.warn(
          `[API Client] Response declared Content-Type "${contentType}" but the body could not be parsed as JSON (${reason}). Falling back to raw text.`,
        );
      }
      return text as unknown as T;
    }
  }

  /* ──────────────────────────────────────────────
   * Observability Logger Helpers
   * ────────────────────────────────────────────── */

  /** Header names whose values must never be written to logs. */
  private static readonly SENSITIVE_HEADERS = new Set([
    'cookie',
    'set-cookie',
    'authorization',
    'proxy-authorization',
    'x-api-key',
    'api-key',
  ]);

  /** Body/field names whose values must never be written to logs. */
  private static readonly SENSITIVE_FIELDS = new Set([
    'password',
    'token',
    'accesstoken',
    'refreshtoken',
    'secret',
    'apikey',
    'authorization',
  ]);

  private static readonly REDACTED = '[REDACTED]';

  private logRequest(
    method: HttpMethod,
    url: string,
    options: Record<string, unknown>,
  ): void {
    console.log(`\n[API Request] ${method} ${url}`);
    if (options.headers) {
      const safeHeaders = this.redactHeaders(
        options.headers as Record<string, string>,
      );
      console.log(`  Headers: ${JSON.stringify(safeHeaders, null, 2).replace(/\n/g, '\n  ')}`);
    }
    if (options.data !== undefined) {
      const safeBody = this.redactValue(options.data);
      console.log(`  Body: ${typeof safeBody === 'object' ? JSON.stringify(safeBody, null, 2).replace(/\n/g, '\n  ') : safeBody}`);
    }
  }

  private logResponse<T>(
    status: number,
    statusText: string,
    headers: Record<string, string>,
    body: T,
    responseTime: number,
  ): void {
    console.log(`[API Response] ${status} ${statusText} (${responseTime}ms)`);
    const safeHeaders = this.redactHeaders(headers);
    console.log(`  Headers: ${JSON.stringify(safeHeaders, null, 2).replace(/\n/g, '\n  ')}`);
    if (body !== null) {
      const safeBody = this.redactValue(body);
      console.log(`  Body: ${typeof safeBody === 'object' ? JSON.stringify(safeBody, null, 2).replace(/\n/g, '\n  ') : safeBody}`);
    }
    console.log('');
  }

  /**
   * Returns a shallow copy of the headers with the values of any
   * sensitive header (cookies, authorization tokens, API keys) masked.
   */
  private redactHeaders(
    headers: Record<string, string>,
  ): Record<string, string> {
    const redacted: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      redacted[key] = ApiClient.SENSITIVE_HEADERS.has(key.toLowerCase())
        ? ApiClient.REDACTED
        : value;
    }
    return redacted;
  }

  /**
   * Recursively masks the values of any sensitive fields (passwords,
   * tokens, secrets) so credentials are never written to logs.
   */
  private redactValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.redactValue(item));
    }

    if (value !== null && typeof value === 'object') {
      const redacted: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        redacted[key] = ApiClient.SENSITIVE_FIELDS.has(key.toLowerCase())
          ? ApiClient.REDACTED
          : this.redactValue(val);
      }
      return redacted;
    }

    return value;
  }
}
