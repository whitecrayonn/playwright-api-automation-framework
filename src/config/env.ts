import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

/**
 * Loads environment variables from a hierarchy of files if they exist:
 * 1. .env (default base)
 * 2. .env.${NODE_ENV} (profile-specific, e.g. .env.dev, .env.staging, .env.prod)
 * 3. .env.local (local developer overrides)
 */
const loadEnvFiles = (): void => {
  const nodeEnv = process.env.NODE_ENV;
  const envFiles = [
    '.env',
    nodeEnv ? `.env.${nodeEnv}` : null,
    '.env.local',
  ].filter((file): file is string => !!file);

  for (const file of envFiles) {
    const envPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: true });
    }
  }
};

// Bootstrap environment loading
loadEnvFiles();

/**
 * Validates and exposes type-safe environment variables.
 * This is the ONLY file in the entire codebase allowed to access process.env directly.
 */
class Env {
  public readonly BASE_URL: string;
  public readonly AUTH_USERNAME: string;
  public readonly AUTH_PASSWORD: string;
  public readonly IS_CI: boolean;

  constructor() {
    this.BASE_URL = this.getRequired('BASE_URL');
    this.validateUrl(this.BASE_URL, 'BASE_URL');

    this.AUTH_USERNAME = this.getRequired('AUTH_USERNAME');
    this.AUTH_PASSWORD = this.getRequired('AUTH_PASSWORD');
    this.IS_CI = process.env.CI === 'true' || process.env.CI === '1';
  }

  private getRequired(key: string): string {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      throw new Error(`CRITICAL CONFIG ERROR: Environment variable "${key}" is required but not set or empty.`);
    }
    return value.trim();
  }

  private validateUrl(url: string, key: string): void {
    try {
      new URL(url);
    } catch {
      throw new Error(`CRITICAL CONFIG ERROR: "${key}" must be a valid absolute URL. Received: "${url}"`);
    }
  }
}

export const env = new Env();
