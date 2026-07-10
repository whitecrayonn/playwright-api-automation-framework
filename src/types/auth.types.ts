/**
 * Request payload for the authentication endpoint.
 */
export interface AuthRequest {
  username: string;
  password: string;
}

/**
 * Response payload returned from a successful authentication call.
 */
export interface AuthResponse {
  token: string;
}
