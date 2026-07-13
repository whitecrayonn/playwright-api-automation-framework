import { ApiRequestOptions } from '@app-types/api.types';

/**
 * Name of the session cookie used by the Restful Booker API to carry the auth token.
 */
export const TOKEN_COOKIE_NAME = 'token';

/**
 * Builds the `Cookie` header value that carries an authentication token.
 *
 * @param token - The raw authentication token string
 */
export const buildTokenCookie = (token: string): string =>
  `${TOKEN_COOKIE_NAME}=${token}`;

/**
 * Returns a copy of the given request options with the authentication token
 * injected as a `Cookie` header. When no token is provided the options are
 * returned unchanged, allowing the client-level session token to take effect.
 *
 * @param options - Base request options to extend
 * @param token - Optional token overriding the client-level session token
 */
export const withAuthToken = (
  options: ApiRequestOptions = {},
  token?: string,
): ApiRequestOptions => {
  if (!token) {
    return options;
  }

  return {
    ...options,
    headers: { ...options.headers, Cookie: buildTokenCookie(token) },
  };
};
