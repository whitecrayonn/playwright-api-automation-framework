---
name: testing-playwright-api-framework
description: Test this Playwright API automation framework locally, including network-free unit isolation and c8 source coverage.
---

# Testing the API automation framework

## Setup

1. Run `npm install`.
2. Copy `.env.example` to `.env`.
3. Replace the placeholder values with the target API URL and credentials.

The public Restful Booker test environment uses:

- `BASE_URL=https://restful-booker.herokuapp.com`
- `AUTH_USERNAME=admin`
- `AUTH_PASSWORD=password123`

The package must remain ESM-compatible because Faker v10 is ESM-only.

## Commands

- Network-free unit suite: `npm run test:unit`
- Full integration and unit suite: `npm test`
- Unit coverage: `npm run coverage:unit`
- Full source coverage: `npm run coverage`
- HTML test report: `reports/html/index.html`
- HTML coverage report: `reports/coverage/index.html`

## Verify unit-test isolation

Temporarily create `.env.local` with a valid but unreachable URL such as
`BASE_URL=https://unreachable.invalid`, then run `npm run test:unit`.
The unit suite should still pass because its `ApiClient` tests use a fake
`APIRequestContext`. Remove `.env.local` before running integration tests.

## Coverage interpretation

c8 should report runtime files under `src/`. Type-only files, tests, and
`playwright.config.ts` are intentionally excluded from aggregate source
coverage. Use `reports/coverage/coverage-summary.json` for machine-readable
assertions.

## Authentication and permissions

The documented Restful Booker credentials can create, update, and delete test
bookings. No private account or browser login is required.

## Devin Secrets Needed

None. The default public Restful Booker environment does not require a stored
secret. For another target environment, provide its `BASE_URL`,
`AUTH_USERNAME`, and `AUTH_PASSWORD` through repo-scoped secrets.
