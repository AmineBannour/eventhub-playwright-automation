# Individual contribution record – Team Red

> **Proposed split. Review it as a team and edit it so it matches who actually did and can explain each part.**
> The instructor may ask anyone to explain or change any part of the code, so everyone should also read `docs/ARCHITECTURE.md` and run the suite once.

## Test ownership – 4 tests each

| Member | Tests owned | Theme |
|---|---|---|
| **Mohamed Amine Bannour** | UI-01 full registration journey · UI-10 sign-in / sign-out · API-01 health & ticket types · API-02 authentication | End-to-end flow, login and the server he built |
| **Lilian Clabecq** | API-03 create · API-04 read · API-05 update · API-06 delete | API CRUD lifecycle |
| **Amira Foudi** | UI-05 PDF upload · UI-06 photo upload · UI-08 dynamic elements · UI-09 dialogs | Interactive UI controls |
| **Salma El Sayed** | UI-02 required fields · UI-03 invalid values (data-driven) · UI-04 boundaries (data-driven) · API-07 API validation (data-driven) | Validation and data-driven testing |
| **Issraa El Aouni** | UI-07 date picker · UI-F01 duplicate email · API-08 error handling · DEMO-01 parallel failure demo | Restrictions, error handling and failure analysis |

## Framework responsibilities

| Member | Area of responsibility | Files / modules | Can personally explain and demo |
|---|---|---|---|
| **Mohamed Amine Bannour** (QA lead) | Framework architecture, configuration, application under test | `playwright.config.ts`, `config/env.ts`, `fixtures/test-fixtures.ts`, `app/server.js`, `app/public/validation.js`, `README.md`, `tests/ui/registration-happy-path.spec.ts`, `tests/ui/authentication.spec.ts`, `tests/api/public-endpoints.spec.ts`, `tests/api/authentication.spec.ts` | Why the framework is layered this way, fixtures and dependency injection, `webServer` start-up, environment and secrets handling, how the app enforces its rules, UI-01, UI-10, API-01, API-02 |
| **Lilian Clabecq** | API automation layer | `clients/BaseApiClient.ts`, `clients/AuthClient.ts`, `clients/PublicClient.ts`, `clients/RegistrationClient.ts`, `utils/schemas.ts`, `utils/assertions.ts`, `tests/api/registrations-crud.spec.ts` | JSON-schema contract checks with Ajv, bearer authentication in the clients, CRUD lifecycle, redaction of secrets in evidence, API-03 to API-06 |
| **Amira Foudi** | UI page objects and interactive UI tests | `pages/BasePage.ts`, `pages/LoginPage.ts`, `pages/RegistrationPage.ts`, `components/ConfirmDialog.ts`, `components/RegistrationsTable.ts`, `tests/ui/uploads.spec.ts`, `tests/ui/dynamic-elements.spec.ts`, `tests/ui/dialogs.spec.ts` | POM, locator strategy (roles and labels), waiting strategy without sleeps, UI-05, UI-06, UI-08, UI-09 |
| **Salma El Sayed** | Test data, data-driven testing and parallel execution | `test-data/registration.factory.ts`, `test-data/invalid-fields.json`, `test-data/boundaries.ts`, `test-data/api-invalid-payloads.ts`, `test-data/files.ts`, `test-data/files/*`, `scripts/generate-test-files.mjs`, `tests/ui/form-validation.spec.ts`, API-07 in `tests/api/registrations-validation.spec.ts` | Data-driven design, boundary value analysis, unique data for isolation, serial vs parallel runs and the parallel timeline, UI-02, UI-03, UI-04, API-07 |
| **Issraa El Aouni** | Reporting, failure analysis, documentation and presentation | `scripts/parallel-timeline.mjs`, `utils/dates.ts`, `tests/ui/date-picker.spec.ts`, `tests/ui/duplicate-registration.spec.ts`, `tests/ui/failure-demo.spec.ts`, API-08 in `tests/api/registrations-validation.spec.ts`, `docs/FAILURE_INVESTIGATION.md`, `docs/TEST_CASES.md`, `evidence/*`, presentation deck | Date rules, error handling, both failure investigations (root cause, fix, prevention), reading the HTML report and traces, UI-07, UI-F01, API-08, DEMO-01 |
