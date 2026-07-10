import { test, expect } from '@fixtures/index';
import { BOOKING_IDS_SCHEMA, BOOKING_SCHEMA } from '@schemas/booking.schema';
import { DataUtils } from '@utils/data.utils';

test.describe('Get Booking API Tests @booking', () => {
  test('should successfully retrieve all booking IDs', async ({
    bookingService,
    schemaValidator,
  }) => {
    const response = await bookingService.getBookingIds();

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);

    // Schema Validation
    const validationResult = schemaValidator.validate(
      BOOKING_IDS_SCHEMA,
      response.body,
    );
    expect(
      validationResult.isValid,
      `Booking IDs schema errors:\n${validationResult.errors?.join('\n')}`,
    ).toBe(true);
  });

  test('should successfully retrieve a specific booking by ID', async ({
    bookingService,
    schemaValidator,
  }) => {
    // 1. Arrange: Create a booking to guarantee its existence
    const newBookingPayload = DataUtils.generateBooking();
    const createResponse = await bookingService.createBooking(newBookingPayload);
    const bookingId = createResponse.body.bookingid;

    // 2. Act: Fetch the booking detail
    const response = await bookingService.getBooking(bookingId);

    // 3. Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual(newBookingPayload);

    // Schema Validation
    const validationResult = schemaValidator.validate(
      BOOKING_SCHEMA,
      response.body,
    );
    expect(
      validationResult.isValid,
      `Booking detail schema errors:\n${validationResult.errors?.join('\n')}`,
    ).toBe(true);
  });

  test('should successfully filter booking IDs by name parameters', async ({
    bookingService,
  }) => {
    // 1. Arrange: Create a booking with unique names
    const newBookingPayload = DataUtils.generateBooking();
    const createResponse = await bookingService.createBooking(newBookingPayload);
    const bookingId = createResponse.body.bookingid;

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
