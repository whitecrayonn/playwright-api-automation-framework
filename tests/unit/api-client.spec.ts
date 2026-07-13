import { test, expect } from '@playwright/test';
import type { APIRequestContext, APIResponse } from '@playwright/test';
import { ApiClient } from '@clients/ApiClient';
import type { HttpMethod } from '@app-types/api.types';

/**
 * Pure unit tests for the transport-layer HTTP client.
 *
 * A hand-rolled fake APIRequestContext records the arguments the client
 * forwards to Playwright and returns a canned APIResponse, so the tests are
 * fully deterministic and require no network access.
 */

interface RecordedCall {
  method: HttpMethod;
  endpoint: string;
  options: Record<string, unknown>;
}

interface FakeResponseInit {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  text?: string;
}

function createFakeResponse(init: FakeResponseInit): APIResponse {
  const fake = {
    status: () => init.status ?? 200,
    statusText: () => init.statusText ?? 'OK',
    headers: () => init.headers ?? {},
    text: async () => init.text ?? '',
  };
  return fake as unknown as APIResponse;
}

function createFakeContext(response: APIResponse): {
  context: APIRequestContext;
  calls: RecordedCall[];
} {
  const calls: RecordedCall[] = [];
  const record =
    (method: HttpMethod) =>
    async (endpoint: string, options: Record<string, unknown>) => {
      calls.push({ method, endpoint, options: options ?? {} });
      return response;
    };
  const context = {
    get: record('GET'),
    post: record('POST'),
    put: record('PUT'),
    patch: record('PATCH'),
    delete: record('DELETE'),
  };
  return { context: context as unknown as APIRequestContext, calls };
}

test.describe('ApiClient (unit) @unit', () => {
  test('routes each verb to the matching APIRequestContext method', async () => {
    const { context, calls } = createFakeContext(
      createFakeResponse({ text: '{}' }),
    );
    const client = new ApiClient(context);

    await client.get('/a');
    await client.post('/b');
    await client.put('/c');
    await client.patch('/d');
    await client.delete('/e');

    expect(calls.map((c) => c.method)).toEqual([
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
    ]);
    expect(calls.map((c) => c.endpoint)).toEqual([
      '/a',
      '/b',
      '/c',
      '/d',
      '/e',
    ]);
  });

  test('parses a JSON body into a typed object', async () => {
    const { context } = createFakeContext(
      createFakeResponse({ text: '{"token":"abc"}' }),
    );
    const client = new ApiClient(context);

    const response = await client.get<{ token: string }>('/auth');

    expect(response.body).toEqual({ token: 'abc' });
    expect(response.status).toBe(200);
    expect(typeof response.responseTime).toBe('number');
    expect(response.responseTime).toBeGreaterThanOrEqual(0);
  });

  test('returns raw text when the body is not valid JSON', async () => {
    const { context } = createFakeContext(
      createFakeResponse({ text: 'Created', status: 201, statusText: 'Created' }),
    );
    const client = new ApiClient(context);

    const response = await client.delete<string>('/booking/1');

    expect(response.body).toBe('Created');
    expect(response.status).toBe(201);
    expect(response.statusText).toBe('Created');
  });

  test('returns null for an empty body', async () => {
    const { context } = createFakeContext(createFakeResponse({ text: '' }));
    const client = new ApiClient(context);

    const response = await client.get('/ping');

    expect(response.body).toBeNull();
  });

  test('surfaces the response headers on the wrapper', async () => {
    const headers = { 'content-type': 'application/json' };
    const { context } = createFakeContext(createFakeResponse({ text: '{}', headers }));
    const client = new ApiClient(context);

    const response = await client.get('/booking');

    expect(response.headers).toEqual(headers);
  });

  test('injects the session token as a Cookie header once set', async () => {
    const { context, calls } = createFakeContext(createFakeResponse({ text: '{}' }));
    const client = new ApiClient(context);

    client.setToken('tok123');
    await client.get('/booking');

    expect(calls[0].options.headers).toEqual({ Cookie: 'token=tok123' });
  });

  test('does not override an explicitly provided Cookie header', async () => {
    const { context, calls } = createFakeContext(createFakeResponse({ text: '{}' }));
    const client = new ApiClient(context);

    client.setToken('session-token');
    await client.put('/booking/1', { headers: { Cookie: 'token=explicit' } });

    expect(calls[0].options.headers).toEqual({ Cookie: 'token=explicit' });
  });

  test('stops injecting the token after clearToken', async () => {
    const { context, calls } = createFakeContext(createFakeResponse({ text: '{}' }));
    const client = new ApiClient(context);

    client.setToken('tok123');
    client.clearToken();
    await client.get('/booking');

    expect(calls[0].options.headers).toBeUndefined();
  });

  test('forwards params, data and timeout options through to the request', async () => {
    const { context, calls } = createFakeContext(createFakeResponse({ text: '{}' }));
    const client = new ApiClient(context);

    await client.post('/booking', {
      params: { firstname: 'Ada' },
      data: { totalprice: 100 },
      timeout: 5000,
    });

    expect(calls[0].options.params).toEqual({ firstname: 'Ada' });
    expect(calls[0].options.data).toEqual({ totalprice: 100 });
    expect(calls[0].options.timeout).toBe(5000);
  });

  test('passes an absolute URL straight through without prefixing the base URL', async () => {
    const { context, calls } = createFakeContext(createFakeResponse({ text: '{}' }));
    const client = new ApiClient(context);

    await client.get('https://third-party.example.com/status');

    expect(calls[0].endpoint).toBe('https://third-party.example.com/status');
  });

  test('omits the headers option entirely when there are no headers', async () => {
    const { context, calls } = createFakeContext(createFakeResponse({ text: '{}' }));
    const client = new ApiClient(context);

    await client.get('/booking');

    expect(calls[0].options.headers).toBeUndefined();
  });
});
