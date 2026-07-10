import { test, expect } from '@fixtures/index';
import { BOOKING_SCHEMA } from '@schemas/booking.schema';
import { DataUtils } from '@utils/data.utils';

test.describe('Update Booking API Tests @booking @regression', () => {
  let bookingId: number;

  test.beforeEach(async ({ bookingService, apiClient, workerToken, cleanup }) => {
    // Inject the worker-cached authentication token safely into the test-scoped ApiClient session
    apiClient.setToken(workerToken);

    // Generate a fresh booking before each update scenario
    const payload = DataUtils.generateBooking();
    const createResponse = await bookingService.createBooking(payload);
    bookingId = createResponse.body.bookingid;

    // Register transactional cleanup passing the robust worker authorization token override
    if (bookingId) {
      cleanup.defer(async () => {
        await bookingService.deleteBooking(bookingId, workerToken);
      });
    }
  });

  test('should successfully update a booking completely using PUT', async ({
    bookingService,
    schemaValidator,
  }) => {
    const updatePayload = DataUtils.generateBooking();

    // Authenticated implicitly via client session token caching
    const response = await bookingService.updateBooking(
      bookingId,
      updatePayload,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual(updatePayload);

    // Schema Validation
    const validationResult = schemaValidator.validate(
      BOOKING_SCHEMA,
      response.body,
    );
    expect(validationResult.isValid).toBe(true);
  });

  test('should successfully modify a booking partially using PATCH', async ({
    bookingService,
    schemaValidator,
  }) => {
    const patchPayload = {
      firstname: 'Jane',
      totalprice: 999,
    };

    // Authenticated implicitly via client session token caching
    const response = await bookingService.partialUpdateBooking(
      bookingId,
      patchPayload,
    );

    expect(response.status).toBe(200);
    expect(response.body.firstname).toBe(patchPayload.firstname);
    expect(response.body.totalprice).toBe(patchPayload.totalprice);

    // Schema Validation
    const validationResult = schemaValidator.validate(
      BOOKING_SCHEMA,
      response.body,
    );
    expect(validationResult.isValid).toBe(true);
  });

  test('should reject updates when authorization token is missing or invalid', async ({
    bookingService,
    apiClient,
  }) => {
    const updatePayload = DataUtils.generateBooking();

    // Clear the client session token to test unauthorized state
    apiClient.clearToken();

    // Or explicitly override with invalid token string
    const response = await bookingService.updateBooking(
      bookingId,
      updatePayload,
      'invalid_token',
    );

    expect(response.status).toBe(403);
  });
});