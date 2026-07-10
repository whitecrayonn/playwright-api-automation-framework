# ADR 0002: AJV Schema Validation and Validator Caching

* **Status:** Approved
* **Date:** 2026-07-10
* **Deciders:** Lead Architect / Staff SDET

---

## Context
API regression suites require validation of JSON response structures (contracts). Hardcoding manual assertions for every JSON property is brittle, verbose, and difficult to maintain. We need a robust contract validation mechanism that can assert payload structures dynamically without introducing runtime performance bottlenecks.

---

## Decision
We chose to implement **AJV (Another JSON Validator)** combined with a custom Map-based **caching layer** inside [SchemaValidator](file:///c:/Portofolio/playwright-api-automation-framework/src/validators/SchemaValidator.ts).

---

## Alternatives Considered

1. **Manual Assertions (e.g. `expect(body.name).toBeString()`)**
   * *Pros:* No dependencies, simple logic.
   * *Cons:* Verbose and error-prone. Does not scale when APIs return complex nested arrays and objects.
2. **Zod Runtime Parsing**
   * *Pros:* Strong static type inference, excellent developer experience.
   * *Cons:* Slower execution speed in high-throughput automated validation environments because Zod parses schemas inline during execution.
3. **AJV (Without Caching)**
   * *Pros:* Fastest validation speed in the JavaScript ecosystem due to internal code generation.
   * *Cons:* Compiling JSON schemas to executable code on every assertion consumes significant CPU resources, leading to test slowdowns at scale.

---

## Consequences
* Standard JSON Schemas can be shared between frontend, backend, and QA test systems.
* API contract issues print clear, granular error reports listing the path and specific failure rule (e.g. `Path "/bookingid" must be number`).
* Validator functions are compiled once and reused, maximizing test suite throughput.

---

## Trade-offs
* **Bundle Size:** Adds `ajv` and `ajv-formats` dependencies.
* **Separation of Types:** We must maintain JSON schemas (`src/schemas/`) alongside TypeScript types (`src/types/`).
