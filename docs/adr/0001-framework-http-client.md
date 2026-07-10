# ADR 0001: Native APIRequestContext vs. Third-Party HTTP Clients

* **Status:** Approved
* **Date:** 2026-07-10
* **Deciders:** Lead Architect / Staff SDET

---

## Context
When designing a Playwright-based API testing framework, we need an HTTP transport client to interact with target APIs. Historically, frameworks have used third-party libraries like Axios, SuperTest, or node-fetch. We need to decide whether to introduce a separate HTTP library or use Playwright's native network client.

---

## Decision
We chose to utilize Playwright's native **APIRequestContext** wrapped inside a custom [ApiClient](file:///c:/Portofolio/playwright-api-automation-framework/src/clients/ApiClient.ts) utility class.

---

## Alternatives Considered

1. **Axios**
   * *Pros:* Well-known API, built-in request/response interceptors, wide community adoption.
   * *Cons:* Requires importing external dependencies. It runs outside the Playwright test lifecycle, meaning we cannot easily share session context (e.g. cookie state) between UI tests and API validation steps.
2. **SuperTest**
   * *Pros:* Native support for asserting endpoints directly.
   * *Cons:* Highly coupled to Express/Node server testing pipelines; less suitable for testing remote APIs. Adds dependency weight.

---

## Consequences
* Playwright handles request context creation and teardown.
* Direct compatibility with Playwright's default HTML reports and tracing facilities.
* Session tokens and cookies can be shared directly with browser contexts for hybrid (API + UI) scenarios.

---

## Trade-offs
* **Playwright Coupling:** The framework becomes heavily tied to the Playwright ecosystem. If we migrate away from Playwright as a test runner in the future, the network layer will need a rewrite. We mitigate this by abstracting network calls within the custom `ApiClient` wrapper.
