# Enterprise Playwright API Automation Framework

[![API Automation Tests](https://github.com/JonathanAudris/playwright-api-automation-framework/actions/workflows/api-tests.yml/badge.svg)](https://github.com/JonathanAudris/playwright-api-automation-framework/actions/workflows/api-tests.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.61.1-green.svg)](https://playwright.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-ready, enterprise-grade API test automation framework built using **Playwright APIRequestContext**, **TypeScript**, and **AJV Schema Validation**, targeting the Restful Booker API. 

This framework is built using clean architecture patterns, SOLID principles, and strict separation of concerns, serving as a template for mid-to-large-scale QA engineering organizations.

---

## 🏗️ Architectural Core

For a comprehensive review of design choices, refer to the [Architecture Documentation](docs/ARCHITECTURE.md).

* **Strict Dependency Injection**: Tests rely on Playwright custom fixtures (`src/fixtures/index.ts`) for instance creation.
* **Encapsulated Config Layer**: Zero raw `process.env` calls outside `env.ts`. Safe, validated config state objects compile instantly at execution bootstrap.
* **Separation of Transport & Domain Logic**: All network calls route through a generic, reusable [ApiClient](src/clients/ApiClient.ts). Business operations are encapsulated inside domain-specific services ([BookingService](src/services/BookingService.ts)).
* **Strict Type Safety**: Written in strict-mode TypeScript (NodeNext resolution), using custom aliases and interfaces—completely eliminating `any` declarations.
* **AJV Schema Assertion**: High-performance JSON schema validations executed inline via a consolidated validator helper class.

---

## 📂 Project Directory Structure

```
├── .github/workflows/          # GitHub Actions CI Workflow
├── docs/                       # Architectural and technical documentation
├── src/
│   ├── clients/                # Generic HTTP transport client (ApiClient)
│   ├── config/                 # Environment validation and configurations
│   ├── constants/              # Route constants and static registries
│   ├── fixtures/               # Dependency injection / Playwright test extensions
│   ├── schemas/                # JSON validation schemas (AJV models)
│   ├── services/               # Business domain wrappers (Auth, Booking)
│   ├── types/                  # Framework type definitions
│   └── utils/                  # Mock data generators (Faker models)
│   └── validators/             # Schema validation wrapper (AJV validator)
└── tests/                      # Automated functional verification suites
    ├── auth/                   # Authentication scenarios
    ├── booking/                # Booking CRUD suites
    └── smoke/                  # System healthcheck ping tests
```

---

## 🛠️ Tech Stack & Dependencies

* **Language**: TypeScript (v5)
* **Test Runner**: Playwright Test (v1.61)
* **Validation**: AJV (v8) + AJV Formats (v3)
* **Configuration**: Dotenv (v17)
* **Mocking**: Faker JS (v10)

---

## 🚀 Setup & Execution

### Prerequisites
* Node.js >= 20.x
* npm >= 10.x

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm ci
   ```
3. Initialize configurations:
   ```bash
   cp .env.example .env
   ```
   *(Ensure you populate the credentials inside `.env` or use the defaults).*

### Running Tests
All runner scripts are configured directly inside `package.json`:

```bash
# Run all tests (Smoke + Regression)
npm run test

# Run smoke tests only (healthchecks)
npm run test:smoke

# Run regression tests only
npm run test:regression

# Run specific domain test suite
npm run test:auth
npm run test:booking

# Open HTML reports after a test execution
npm run report
```

---

## 🖥️ CI/CD Integration
This repository integrates a fully functional GitHub Actions pipeline defined in `.github/workflows/api-tests.yml`. The workflow executes:
* Dependency resolution check and installation (`npm ci`).
* Test execution against target environments.
* Automatic artifact persistence uploading HTML execution results for post-run analysis.
