# Engineering Decisions Log

This document explains the technical rationale, trade-offs, and design motivations behind key architectural decisions in the framework.

---

## 🚀 1. Native APIRequestContext vs. Third-Party Clients (Axios / SuperTest)

### Context
API testing frameworks often rely on Axios, SuperTest, or node-fetch for HTTP communication. We evaluated whether to introduce these libraries or leverage Playwright's native `APIRequestContext`.

### Decision
We chose Playwright's native `APIRequestContext` wrapped inside a custom [ApiClient](file:///c:/Portofolio/playwright-api-automation-framework/src/clients/ApiClient.ts).

### Rationale
* **Zero Dependency Inflation:** Eliminates extra NPM dependencies, reducing security vulnerabilities and bundle footprint.
* **Unified Lifecycle:** Playwright handles browser cookies, storage state, and context disposal out of the box. Using `APIRequestContext` allows future integration where API authentication states can be passed directly to UI browsers.
* **Parallel Execution Safety:** Playwright isolates network requests per worker context, eliminating cross-talk issues.

---

## ⚡ 2. AJV Schema Validation with Compiled Validator Caching

### Context
Validating JSON response payloads against schemas ensures API contract compliance. However, compiling JSON schemas into executable JavaScript functions is CPU-heavy.

### Decision
We use AJV Schema Validation coupled with a runtime compilation cache inside [SchemaValidator](file:///c:/Portofolio/playwright-api-automation-framework/src/validators/SchemaValidator.ts).

### Rationale
* **Performance at Scale:** In regression runs, the same schema is validated hundreds of times. Compiling the schema on every validation degrades test execution speeds. Caching the compiled `ValidateFunction` inside a standard Map preserves execution speed.
* **Inline Schema Checking:** High-performance validation rules can be executed with a single line of assertion syntax in spec tests, outputting detailed paths for structure violations instead of generic assertion failures.

---

## 🏛️ 3. Fixture-Based Dependency Injection Container

### Context
In many test automation frameworks, service classes are instantiated inside spec files (e.g., `const bookingService = new BookingService(new ApiClient())`). This introduces repetitive setup blocks.

### Decision
We configure all service classes, clients, and utilities in a central fixture configuration file [fixtures/index.ts](file:///c:/Portofolio/playwright-api-automation-framework/src/fixtures/index.ts).

### Rationale
* **Dry Spec Files:** Test specs only declare the dependencies they need in their signature arguments (e.g., `async ({ bookingService }) => { ... }`).
* **Lifecycles Isolation:** Playwright manages worker-scoped (thread-isolated) vs. test-scoped resource lifecycles automatically. The creation and disposal of clients and connections are completely hidden from the test suite.

---

## 🧹 4. FILO-Ordered Automated Cleanup Registry

### Context
Tests that create state (e.g., POST `/booking`) must delete that state upon completion to prevent database pollution. Implementing manual cleanups in `afterEach` hooks often fails if a test aborts early or runs in parallel with others.

### Decision
We implemented a custom [CleanupRegistry](file:///c:/Portofolio/playwright-api-automation-framework/src/fixtures/index.ts#L12) that is registered as a test-scoped fixture.

### Rationale
* **Dynamic Registration:** Cleanups are registered *during* the execution flow immediately after a resource is created, matching the exact scope of the test run.
* **FILO Execution:** Deferrals are popped in First-In, Last-Out sequence, guaranteeing that dependent resources are cleaned up before their parent components.
* **Failure Resiliency:** The registry catches all cleanup execution failures, aggregates them, and reports them at the end of the run without blocking adjacent teardown tasks.

---

## 🔒 5. Startup Environment Validation

### Context
API test suites fail silently or produce false positives if environment configurations (e.g., invalid target base URL, incorrect credentials) are missing or misconfigured.

### Decision
We execute environment checks immediately on configuration loading in [env.ts](file:///c:/Portofolio/playwright-api-automation-framework/src/config/env.ts).

### Rationale
* **Fail-Fast Behavior:** The execution halts with an explicit error explaining which configuration key is missing before tests start spinning up workers.
* **Strict Typing:** Decouples variables from string-based maps, exposing read-only configurations as primitive constants.
