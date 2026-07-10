import { test, expect } from '@fixtures/index';
import { DataUtils } from '@utils/data.utils';
import { config } from '@config/config';

test.describe('Delete Booking API Tests @booking', () => {
  let token: string;
  let bookingId: number;

  test.beforeAll(async ({ authService }) => {
    const authResponse = await authService.createToken({
      username: config.auth.username,
      password: config.auth.password,
    });
    token = authResponse.body.token;
  });

  test.beforeEach(async ({ bookingService, apiClient }) => {
    // Inject the authentication token into the test-scoped ApiClient session
    apiClient.setToken(token);

    const payload = DataUtils.generateBooking();
    const createResponse = await bookingService.createBooking(payload);
    bookingId = createResponse.body.bookingid;
  });

  test('should successfully delete a booking using DELETE', async ({
    bookingService,
  }) => {
    // 1. Act: Delete resource (authenticated implicitly via client session token)
    // Restful Booker returns 201 Created on success
    const deleteResponse = await bookingService.deleteBooking(bookingId);
    expect(deleteResponse.status).toBe(201);

    // 2. Assert: Verify resource no longer exists
    const getResponse = await bookingService.getBooking(bookingId);
    expect(getResponse.status).toBe(404);
  });

  test('should reject deletion when authorization token is missing or invalid', async ({
    bookingService,
    apiClient,
  }) => {
    // Clear the client session token to test unauthorized state
    apiClient.clearToken();

    // Act: Delete resource with bad token
    const deleteResponse = await bookingService.deleteBooking(
      bookingId,
      'invalid_token',
    );

    // Assert: Check status is 403 Forbidden
    expect(deleteResponse.status).toBe(403);
  });
});
