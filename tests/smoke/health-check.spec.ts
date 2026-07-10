import { test, expect } from '@fixtures/index';
import { ENDPOINTS } from '@constants/endpoints';

test.describe('Sanity Smoke Tests @smoke', () => {
  test('should verify the API healthcheck endpoint responds successfully', async ({
    apiClient,
  }) => {
    const response = await apiClient.get(ENDPOINTS.PING);

    // Restful Booker /ping endpoint returns HTTP 201 Created on success
    expect(response.status).toBe(201);
  });
});
