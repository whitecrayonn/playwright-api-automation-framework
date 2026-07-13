import { ApiClient } from '@clients/ApiClient';
import { ENDPOINTS } from '@constants/endpoints';
import { ApiResponse } from '@app-types/api.types';
import { withAuthToken } from '@utils/http.utils';
import {
  Booking,
  BookingIdResponse,
  BookingQueryFilters,
  CreateBookingResponse,
} from '@app-types/booking.types';

/**
 * Service class for executing Booking business processes.
 * Encapsulates CRUD operation routing and query parameter mapping.
 */
export class BookingService {
  constructor(private readonly apiClient: ApiClient) {}

  /**
   * Retrieves a list of booking identifier references, optionally filtered.
   *
   * @param filters - Optional query parameters (firstname, lastname, checkin, checkout)
   */
  async getBookingIds(
    filters?: BookingQueryFilters,
  ): Promise<ApiResponse<BookingIdResponse[]>> {
    return this.apiClient.get<BookingIdResponse[]>(ENDPOINTS.BOOKING, {
      params: filters,
    });
  }

  /**
   * Retrieves details of a specific booking by its ID.
   *
   * @param id - The unique booking identifier
   */
  async getBooking(id: number): Promise<ApiResponse<Booking>> {
    return this.apiClient.get<Booking>(ENDPOINTS.BOOKING_ID(id));
  }

  /**
   * Creates a new booking record.
   *
   * @param payload - Complete booking detail information
   */
  async createBooking(
    payload: Booking,
  ): Promise<ApiResponse<CreateBookingResponse>> {
    return this.apiClient.post<CreateBookingResponse>(ENDPOINTS.BOOKING, {
      data: payload,
    });
  }

  /**
   * Updates an existing booking record completely.
   *
   * @param id - The unique booking identifier
   * @param payload - Complete booking detail information
   * @param token - Optional authentication token to override client-level auth
   */
  async updateBooking(
    id: number,
    payload: Booking,
    token?: string,
  ): Promise<ApiResponse<Booking>> {
    return this.apiClient.put<Booking>(
      ENDPOINTS.BOOKING_ID(id),
      withAuthToken({ data: payload }, token),
    );
  }

  /**
   * Partially modifies an existing booking record.
   *
   * @param id - The unique booking identifier
   * @param payload - Partial subset of booking detail values
   * @param token - Optional authentication token to override client-level auth
   */
  async partialUpdateBooking(
    id: number,
    payload: Partial<Booking>,
    token?: string,
  ): Promise<ApiResponse<Booking>> {
    return this.apiClient.patch<Booking>(
      ENDPOINTS.BOOKING_ID(id),
      withAuthToken({ data: payload }, token),
    );
  }

  /**
   * Deletes an existing booking record.
   * Note: Restful Booker returns status code 201 'Created' on successful deletion.
   *
   * @param id - The unique booking identifier
   * @param token - Optional authentication token to override client-level auth
   */
  async deleteBooking(
    id: number,
    token?: string,
  ): Promise<ApiResponse<string>> {
    return this.apiClient.delete<string>(
      ENDPOINTS.BOOKING_ID(id),
      withAuthToken({}, token),
    );
  }
}
