import { test, expect } from '@fixtures/index';
import { CREATE_BOOKING_RESPONSE_SCHEMA } from '@schemas/booking.schema';
import { DataUtils } from '@utils/data.utils';

test.describe('Create Booking API Tests @booking', () => {
  test('should successfully create a new booking', async ({
    bookingService,
    schemaValidator,
  }) => {
    const payload = DataUtils.generateBooking();

    const response = await bookingService.createBooking(payload);

    expect(response.status).toBe(200);
    expect(response.body.bookingid).toBeDefined();
    expect(response.body.bookingid).toBeGreaterThan(0);
    expect(response.body.booking).toEqual(payload);

    // Schema Validation
    const validationResult = schemaValidator.validate(
      CREATE_BOOKING_RESPONSE_SCHEMA,
      response.body,
    );
    expect(
      validationResult.isValid,
      `Create booking response schema errors:\n${validationResult.errors?.join('\n')}`,
    ).toBe(true);
  });
});
