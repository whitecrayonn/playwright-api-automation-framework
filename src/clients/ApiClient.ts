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

  private logRequest(
    method: HttpMethod,
    url: string,
    options: Record<string, unknown>,
  ): void {
    console.log(`\n[API Request] ${method} ${url}`);
    if (options.headers) {
      console.log(`  Headers: ${JSON.stringify(options.headers, null, 2).replace(/\n/g, '\n  ')}`);
    }
    if (options.data !== undefined) {
      console.log(`  Body: ${typeof options.data === 'object' ? JSON.stringify(options.data, null, 2).replace(/\n/g, '\n  ') : options.data}`);
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
    console.log(`  Headers: ${JSON.stringify(headers, null, 2).replace(/\n/g, '\n  ')}`);
    if (body !== null) {
      console.log(`  Body: ${typeof body === 'object' ? JSON.stringify(body, null, 2).replace(/\n/g, '\n  ') : body}`);
    }
    console.log('');
  }
}
