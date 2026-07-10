/**
 * JSON Schema definitions for Booking entities and responses.
 */

export const BOOKING_DATES_SCHEMA = {
  type: 'object',
  properties: {
    checkin: { type: 'string', format: 'date' },
    checkout: { type: 'string', format: 'date' },
  },
  required: ['checkin', 'checkout'],
  additionalProperties: false,
} as const;

export const BOOKING_SCHEMA = {
  type: 'object',
  properties: {
    firstname: { type: 'string' },
    lastname: { type: 'string' },
    totalprice: { type: 'integer' },
    depositpaid: { type: 'boolean' },
    bookingdates: BOOKING_DATES_SCHEMA,
    additionalneeds: { type: 'string' },
  },
  required: [
    'firstname',
    'lastname',
    'totalprice',
    'depositpaid',
    'bookingdates',
  ],
  additionalProperties: false,
} as const;

export const CREATE_BOOKING_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    bookingid: { type: 'integer' },
    booking: BOOKING_SCHEMA,
  },
  required: ['bookingid', 'booking'],
  additionalProperties: false,
} as const;

export const BOOKING_IDS_SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      bookingid: { type: 'integer' },
    },
    required: ['bookingid'],
    additionalProperties: false,
  },
} as const;
