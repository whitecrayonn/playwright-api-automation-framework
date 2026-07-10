# Testing Guidelines & Developer Onboarding Guide

This guide describes how to write, organize, and maintain API automation tests within this framework.

---

## 🛠️ 1. Writing a New Test Spec

All tests must import `test` and `expect` from the fixtures layer rather than `@playwright/test` directly. This grants specs automatic access to domain services, the schema validator, and cleanup registries.

### Example Spec Structure:
```typescript
import { test, expect } from '@fixtures/index';
import { MY_RESPONSE_SCHEMA } from '@schemas/my-domain.schema';
import { DataUtils } from '@utils/data.utils';

test.describe('My Domain API Tests', () => {
  test('should verify resource creation', async ({
    bookingService, // Injected service
    schemaValidator, // Injected validator
    cleanup,         // Injected cleanup registry
  }) => {
    // 1. Arrange payload
    const payload = DataUtils.generateBooking();

    // 2. Act
    const response = await bookingService.createBooking(payload);

    // 3. Assert status
    expect(response.status).toBe(200);

    // 4. Register Cleanup (FILO order)
    cleanup.defer(async () => {
      await bookingService.deleteBooking(response.body.bookingid);
    });

    // 5. Contract Validation
    const validation = schemaValidator.validate(MY_RESPONSE_SCHEMA, response.body);
    expect(validation.isValid, `Schema error: ${validation.errors}`).toBe(true);
  });
});
```

---

## 🏗️ 2. Writing a New Domain Service

Services encapsulate API business rules and endpoints. They must compose the core `ApiClient` rather than executing HTTP calls directly.

### Steps:
1. Register endpoints in [endpoints.ts](file:///c:/Portofolio/playwright-api-automation-framework/src/constants/endpoints.ts).
2. Create your service under `src/services/` (e.g., `PaymentService.ts`).
3. Inject the service into Playwright's container inside [fixtures/index.ts](file:///c:/Portofolio/playwright-api-automation-framework/src/fixtures/index.ts).

### Example Service Implementation:
```typescript
import { ApiClient } from '@clients/ApiClient';
import { ENDPOINTS } from '@constants/endpoints';
import { ApiResponse } from '@app-types/api.types';
import { PaymentRequest, PaymentResponse } from '@app-types/payment.types';

export class PaymentService {
  constructor(private readonly apiClient: ApiClient) {}

  async processPayment(payload: PaymentRequest): Promise<ApiResponse<PaymentResponse>> {
    return this.apiClient.post<PaymentResponse>(ENDPOINTS.PAYMENT, {
      data: payload,
    });
  }
}
```

---

## 🔒 3. Defining Schemas & Contract Validation

To keep validation robust and reusable:
* Place schemas in `src/schemas/` with a suffix `.schema.ts` (e.g. `booking.schema.ts`).
* Ensure schemas match AJV format expectations.
* Do not perform deep nested property validation inside specs. Rely on `schemaValidator.validate()` to assert the response structure.

---

## 🧹 4. Managing Test State and Cleanups

To keep the target database pristine and avoid cross-test contamination:
* **Always Defer Cleanups:** Any test that creates state (via `POST`, `PUT`, etc.) must register a cleanup task using the `cleanup` fixture.
* **Tolerate Errors:** The cleanup functions catch missing resources (e.g., a resource that was already deleted by the test) and ignore 404 responses to keep the pipeline clean.
* **Order of Execution:** Tasks are executed in reverse order of declaration (FILO), ensuring child resources are removed before their parents.

```typescript
cleanup.defer(async () => {
  await bookingService.deleteBooking(bookingId);
});
```

---

## 📊 5. Type Safety Conventions

* **No `any` usage:** Direct use of `any` is forbidden. Always declare explicit request and response models inside `src/types/`.
* **Standard Response Wrapper:** All service calls must return `Promise<ApiResponse<T>>`, preserving access to response headers, status codes, and execution latencies.
* **Path Mapping:** Always use absolute path mapping aliases (e.g. `@services/*`, `@app-types/*`) instead of relative paths (`../../`).
