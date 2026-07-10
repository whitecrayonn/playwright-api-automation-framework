/**
 * Centralized registry of all API endpoints in the framework.
 * Prevents magic strings inside service wrappers.
 */
export const ENDPOINTS = {
  /** Authentication endpoint */
  AUTH: '/auth',

  /** Booking root endpoint (GET lists, POST create) */
  BOOKING: '/booking',

  /** Booking resource identifier path */
  BOOKING_ID: (id: number) => `/booking/${id}`,

  /** Sanity healthcheck ping endpoint */
  PING: '/ping',
} as const;
