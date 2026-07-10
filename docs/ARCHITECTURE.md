# Framework Architecture Design Document

This document outlines the architectural blueprint, design choices, and data flow of the Playwright API Automation Framework. The system is designed following SOLID principles, clean architecture patterns, and strict Separation of Concerns (SoC).

---

## 🏗️ Structural Overview

```
                          ┌───────────────────────┐
                          │         Tests         │
                          └───────────┬───────────┘
                                      │
                         (dependency injection via fixtures)
                                      ▼
                          ┌───────────────────────┐
                          │       Services        │
                          └───────────┬───────────┘
                                      │
                       (composed helper endpoints/payloads)
                                      ▼
                          ┌───────────────────────┐
                          │       ApiClient       │
                          └───────────┬───────────┘
                                      │
                     (low-level HTTP client wrapping PW)
                                      ▼
                    ┌───────────────────────────────────┐
                    │ Playwright HTTP Request Context   │
                    └───────────────────────────────────┘
```

---

## 🏛️ Architectural Layers

### 1. Configuration Layer (`src/config/`)
- **`env.ts`**: The single source of truth for raw environment boundary checks. It validates properties inside `process.env` immediately upon import, throwing descriptive exceptions on configuration mismatch. This prevents silent execution failures.
- **`config.ts`**: Builds a strongly-typed, read-only configuration schema structure (`AppConfig`) from the validated variables, which is then safely consumed by tests, Playwright configs, or services.

### 2. Transport Client Layer (`src/clients/`)
- **`ApiClient.ts`**: Exposes generic, lightweight, type-safe wrapper methods (`get`, `post`, `put`, `patch`, `delete`) to handle Playwright's `APIRequestContext` interactions.
- **Rules**:
  - Never throws exceptions on non-2xx status codes (to support assertion validation on error scenarios like `401 Unauthorized` or `404 Not Found`).
  - Standardizes the response format wrapping data, execution response time, headers, and parsed content inside `ApiResponse<T>`.

### 3. Business Service Layer (`src/services/`)
- Services wrap discrete functional domains of the product under test (e.g., `AuthService`, `BookingService`).
- Uses composition of `ApiClient` to map functional inputs to network transport calls, managing endpoints registry configuration and token inclusion headers dynamically.

### 4. Schema Verification & Validation Layer (`src/validators/` & `src/schemas/`)
- Uses AJV and `ajv-formats` to perform full runtime schema validations against JSON payloads in one line inside test steps, isolating verification models from domain wrappers.

---

## ⚡ Data Flow Pipeline

```
.env (Secrets) ──▶ env.ts (Validation) ──▶ config.ts (Structure) ──▶ playwright.config.ts / Services
```

---

## 🎨 Core Design Decisions & SOLID Compliance

- **Single Responsibility Principle (SRP)**: Each class has a single focus. `SchemaValidator` only validates structures; `ApiClient` only executes HTTP calls; `BookingService` only manages booking-domain concerns.
- **Open/Closed Principle (OCP)**: Adding new endpoints or API domains only requires writing new `services/` and `types/` definitions—never modifying the underlying `ApiClient` transport core.
- **Dependency Inversion Principle (DIP)**: High-level test components do not instantiate services or transport layers directly. Services are injected via Playwright fixtures container hooks (`src/fixtures/index.ts`).
- **No Direct Environment Access**: Tests and services are decoupled from the system platform variables. No `process.env` calls are present inside tests.
- **Composition over Inheritance**: Services delegate low-level request tasks to the `ApiClient` through configuration composition rather than extending base classes.
