import { CleanupRegistry } from '@fixtures/index';
import { BookingService } from '@services/BookingService';
import { DataUtils } from '@utils/data.utils';
import { Booking } from '@app-types/booking.types';

/**
 * A booking created by an arrange helper, exposing both the generated id and the
 * exact payload used so tests can assert round-trip equality.
 */
export interface TrackedBooking {
  bookingId: number;
  payload: Booking;
}

/**
 * Registers deferred deletion of a booking on the cleanup registry.
 * No-op when the id is falsy, mirroring the guard used across booking specs.
 *
 * @param cleanup - Test-scoped cleanup registry
 * @param bookingService - Service used to perform the deletion
 * @param bookingId - Identifier of the booking to delete during teardown
 * @param token - Optional token override forwarded to the delete call
 */
export function deferBookingDeletion(
  cleanup: CleanupRegistry,
  bookingService: BookingService,
  bookingId: number | undefined,
  token?: string,
): void {
  if (!bookingId) {
    return;
  }

  cleanup.defer(async () => {
    await bookingService.deleteBooking(bookingId, token);
  });
}

/**
 * Creates a fresh randomized booking and registers its deletion for automatic
 * teardown. Consolidates the create-then-defer-cleanup arrangement repeated by
 * the booking specs.
 *
 * @param bookingService - Service used to create and later delete the booking
 * @param cleanup - Test-scoped cleanup registry
 * @param token - Optional token override forwarded to the cleanup deletion
 */
export async function createTrackedBooking(
  bookingService: BookingService,
  cleanup: CleanupRegistry,
  token?: string,
): Promise<TrackedBooking> {
  const payload = DataUtils.generateBooking();
  const createResponse = await bookingService.createBooking(payload);
  const bookingId = createResponse.body.bookingid;

  deferBookingDeletion(cleanup, bookingService, bookingId, token);

  return { bookingId, payload };
}
