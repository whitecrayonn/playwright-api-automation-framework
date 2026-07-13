import { test, expect } from '@fixtures/index';
import { BOOKING_IDS_SCHEMA, BOOKING_SCHEMA } from '@schemas/booking.schema';
import { createTrackedBooking } from '@support/booking.helpers';
import { expectValidSchema } from '@support/schema.helpers';

test.describe('Get Booking API Tests @booking @regression', () => {
  test('should successfully retrieve all booking IDs', async ({
    bookingService,
    schemaValidator,
  }) => {
    const response = await bookingService.getBookingIds();

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);

    expectValidSchema(
      schemaValidator,
      BOOKING_IDS_SCHEMA,
      response.body,
      'Booking IDs schema',
    );
  });

  test('should successfully retrieve a specific booking by ID', async ({
    bookingService,
    schemaValidator,
    cleanup,
  }) => {
    // 1. Arrange: Create a booking to guarantee its existence
    const { bookingId, payload: newBookingPayload } = await createTrackedBooking(
      bookingService,
      cleanup,
    );

    // 2. Act: Fetch the booking detail
    const response = await bookingService.getBooking(bookingId);

    // 3. Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual(newBookingPayload);

    expectValidSchema(
      schemaValidator,
      BOOKING_SCHEMA,
      response.body,
      'Booking detail schema',
    );
  });

  test('should successfully filter booking IDs by name parameters', async ({
    bookingService,
    cleanup,
  }) => {
    // 1. Arrange: Create a booking with unique names
    const { bookingId, payload: newBookingPayload } = await createTrackedBooking(
      bookingService,
      cleanup,
    );

    const filters = {
      firstname: newBookingPayload.firstname,
      lastname: newBookingPayload.lastname,
    };

    // 2. Act: Filter using query parameters
    const response = await bookingService.getBookingIds(filters);

    // 3. Assert
    expect(response.status).toBe(200);
    const isIdInFilteredList = response.body.some(
      (item) => item.bookingid === bookingId,
    );
    expect(
      isIdInFilteredList,
      `Booking ID ${bookingId} was not found in filtered list for ${filters.firstname} ${filters.lastname}`,
    ).toBe(true);
  });
});
