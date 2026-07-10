/**
 * Date range boundaries for a booking.
 */
export interface BookingDates {
  checkin: string;
  checkout: string;
}

/**
 * Complete booking record representation.
 */
export interface Booking {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: BookingDates;
  additionalneeds?: string;
}

/**
 * Response payload returned upon successful creation of a booking.
 */
export interface CreateBookingResponse {
  bookingid: number;
  booking: Booking;
}

/**
 * Individual booking reference identifier.
 */
export interface BookingIdResponse {
  bookingid: number;
}

/**
 * Allowed query parameters for filtering and retrieving booking lists.
 */
export interface BookingQueryFilters {
  firstname?: string;
  lastname?: string;
  checkin?: string;
  checkout?: string;
  [key: string]: string | number | boolean | undefined;
}
