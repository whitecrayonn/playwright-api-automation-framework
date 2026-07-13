import { test, expect } from '@playwright/test';
import { DataUtils } from '@utils/data.utils';

/**
 * Pure unit tests for the Faker-backed booking generator.
 * Verifies the generated payload shape and invariants without any network.
 */
test.describe('DataUtils (unit) @unit', () => {
  const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
  const ALLOWED_NEEDS = [
    'Breakfast',
    'Late Checkout',
    'Extra Pillows',
    'Airport Shuttle',
  ];

  test('generates a fully populated booking with correctly typed fields', () => {
    const booking = DataUtils.generateBooking();

    expect(typeof booking.firstname).toBe('string');
    expect(booking.firstname.length).toBeGreaterThan(0);
    expect(typeof booking.lastname).toBe('string');
    expect(booking.lastname.length).toBeGreaterThan(0);
    expect(Number.isInteger(booking.totalprice)).toBe(true);
    expect(booking.totalprice).toBeGreaterThanOrEqual(100);
    expect(booking.totalprice).toBeLessThanOrEqual(1000);
    expect(typeof booking.depositpaid).toBe('boolean');
    expect(ALLOWED_NEEDS).toContain(booking.additionalneeds);
  });

  test('produces ISO date strings with checkout on or after checkin', () => {
    const { bookingdates } = DataUtils.generateBooking();

    expect(bookingdates.checkin).toMatch(DATE_PATTERN);
    expect(bookingdates.checkout).toMatch(DATE_PATTERN);
    expect(
      new Date(bookingdates.checkout).getTime(),
    ).toBeGreaterThanOrEqual(new Date(bookingdates.checkin).getTime());
  });

  test('produces varied data across invocations', () => {
    const generated = Array.from({ length: 20 }, () => DataUtils.generateBooking());
    const uniqueFirstNames = new Set(generated.map((b) => b.firstname));

    expect(uniqueFirstNames.size).toBeGreaterThan(1);
  });
});
