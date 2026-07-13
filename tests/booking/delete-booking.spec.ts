import { test, expect } from '@fixtures/index';
import { createTrackedBooking } from '@support/booking.helpers';

test.describe('Delete Booking API Tests @booking @regression', () => {
  let bookingId: number;

  test.beforeEach(async ({ bookingService, apiClient, workerToken, cleanup }) => {
    // Inject the worker-cached authentication token safely into the test-scoped ApiClient session
    apiClient.setToken(workerToken);

    // Arrange a booking, registering worker-token cleanup for teardown
    ({ bookingId } = await createTrackedBooking(bookingService, cleanup, workerToken));
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