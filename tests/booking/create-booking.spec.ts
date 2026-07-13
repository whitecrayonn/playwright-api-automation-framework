import { test, expect } from '@fixtures/index';
import { CREATE_BOOKING_RESPONSE_SCHEMA } from '@schemas/booking.schema';
import { DataUtils } from '@utils/data.utils';
import { deferBookingDeletion } from '@support/booking.helpers';
import { expectValidSchema } from '@support/schema.helpers';

test.describe('Create Booking API Tests @booking @regression', () => {
  test('should successfully create a new booking', async ({
    bookingService,
    schemaValidator,
    cleanup,
  }) => {
    const payload = DataUtils.generateBooking();

    const response = await bookingService.createBooking(payload);

    expect(response.status).toBe(200);
    expect(response.body.bookingid).toBeDefined();
    expect(response.body.bookingid).toBeGreaterThan(0);
    expect(response.body.booking).toEqual(payload);

    deferBookingDeletion(cleanup, bookingService, response.body?.bookingid);

    expectValidSchema(
      schemaValidator,
      CREATE_BOOKING_RESPONSE_SCHEMA,
      response.body,
      'Create booking response schema',
    );
  });
});
