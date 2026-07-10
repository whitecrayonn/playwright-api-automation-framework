import { env } from './env';

/**
 * Centralized configuration object for the entire automation framework.
 * Code outside the config layer imports this object rather than reading env variables directly.
 */
export const config = {
  api: {
    baseUrl: env.BASE_URL,
    timeout: 30_000,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
  auth: {
    username: env.AUTH_USERNAME,
    password: env.AUTH_PASSWORD,
  },
  test: {
    isCi: env.IS_CI,
    workers: env.IS_CI ? 4 : undefined,
    retries: env.IS_CI ? 2 : 0,
  },
} as const;

export type AppConfig = typeof config;
