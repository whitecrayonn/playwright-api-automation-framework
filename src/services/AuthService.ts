import { ApiClient } from '@clients/ApiClient';
import { ENDPOINTS } from '@constants/endpoints';
import { AuthRequest, AuthResponse } from '@app-types/auth.types';
import { ApiResponse } from '@app-types/api.types';

/**
 * Service class for executing Authentication business processes.
 * Wraps the auth endpoints and handles request/response typing.
 */
export class AuthService {
  constructor(private readonly apiClient: ApiClient) {}

  /**
   * Generates a new security token using credentials.
   *
   * @param payload - Username and Password credentials
   */
  async createToken(payload: AuthRequest): Promise<ApiResponse<AuthResponse>> {
    return this.apiClient.post<AuthResponse>(ENDPOINTS.AUTH, {
      data: payload,
    });
  }
}
