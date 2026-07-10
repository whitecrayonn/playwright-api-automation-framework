import { faker } from '@faker-js/faker';
import { Booking } from '@app-types/booking.types';

/**
 * Reusable dynamic mock data generator using Faker.
 */
export class DataUtils {
  /**
   * Generates a fully populated random Booking entity.
   */
  static generateBooking(): Booking {
    const checkinDate = faker.date.soon({ days: 2 });
    const checkoutDate = faker.date.soon({ days: 5, refDate: checkinDate });

    return {
      firstname: faker.person.firstName(),
      lastname: faker.person.lastName(),
      totalprice: faker.number.int({ min: 100, max: 1000 }),
      depositpaid: faker.datatype.boolean(),
      bookingdates: {
        checkin: checkinDate.toISOString().split('T')[0],
        checkout: checkoutDate.toISOString().split('T')[0],
      },
      additionalneeds: faker.helpers.arrayElement([
        'Breakfast',
        'Late Checkout',
        'Extra Pillows',
        'Airport Shuttle',
      ]),
    };
  }
}
