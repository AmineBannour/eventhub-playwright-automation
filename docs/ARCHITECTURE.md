# Framework architecture & technical decisions

## 1. Application under test – why EventHub

| Checklist item (assignment §3) | EventHub |
|---|---|
| Accessible and stable for repeated testing | Runs locally with `npm run app` (Playwright starts it automatically). In-memory data, so every start is clean. No ads, rate limits or outages. |
| All mandatory UI elements, with real behaviour | See the table below. |
| Enough scenarios for the required test counts | 10 UI + 1 failure-oriented case, 8 API cases, ~40 report entries in total once the data-driven cases expand. |
| Accessible API suitable for automation | JSON REST API with bearer-token auth, CRUD, validation errors, 401/404/409/400 responses, consistent headers. |
| Testing allowed by the terms of use | It is the team's own application, so there are no third-party terms to respect. |
| Data can be created, isolated and cleaned up | Every test creates its own records (unique email) and deletes them afterwards through the API. |

We first considered YouTube (used in assignments #1 and #2) and public demo sites. YouTube has no file upload, date picker or number input for signed-out users, and its terms forbid automated access. The public practice sites were not reachable from our network, and none of them rejects invalid images or restricts dates. A small purpose-built app avoids all of these problems and lets the instructor run everything offline on a clean machine.

### Mandatory UI elements

| Element | Where in EventHub | Real behaviour that the tests check |
|---|---|---|
| Text input | Full name, Email | Required, 2–50 characters, allowed characters, email format, live re-validation |
| Number input | Age (18–99), Number of tickets (1–10) | Range limits, whole numbers only, `min`/`max` attributes, price calculation |
| Text area | Notes | Multi-line text kept end-to-end, live counter, 500-character limit |
| File upload | ID document | PDF only, at most 1 MB, file name and size shown, rejected file is cleared |
| Image upload | Profile photo | PNG/JPEG only, at most 2 MB, the image is decoded (fake images rejected), preview and real dimensions shown |
| Dropdown | Ticket type | Options loaded from the rules, selected value drives the price |
| Date picker | Event date | From tomorrow up to 365 days ahead, no Sundays, readable date shown in the confirmation |
| Dialog | Confirmation modal (`<dialog>`) + native `confirm()` on delete | Confirm/cancel change the application state |
| Dynamic elements | Total price, character counter, spinner, toast notifications, live list filter, validation messages | Appear, update and disappear as the user interacts |

## 2. Language choice – TypeScript

- **Technical fit:** Playwright is written in TypeScript. Its test runner, fixtures and APIs are designed for TS/JS first, and new features ship there first.
- **Maintainability:** static types catch broken page-object calls and wrong payload shapes at compile time (`npm run typecheck`) instead of during a test run.
- **Ecosystem:** Ajv for JSON Schema, dotenv for configuration, and the same language as the application under test.
- **Team experience:** the team already knows JavaScript from web courses, and TypeScript adds safety without a new paradigm.

## 3. Layers

```
tests/ (what to verify)          ──uses──▶ fixtures/ (setup, teardown, isolation)
   │                                         │
   ├── pages/ + components/ (UI how)         ├── clients/ (API how)
   │      BasePage                           │      BaseApiClient ─▶ Auth / Public / Registration
   │      LoginPage, RegistrationPage        │
   │      ConfirmDialog, RegistrationsTable  │
   └── utils/ (assertions, schemas, dates)   └── test-data/ (factory, data sets, files)
                         config/env.ts (environment)
```

| Principle | How it is applied |
|---|---|
| POM | Selectors live only in `pages/` and `components/`. If the UI changes, one file changes, not every test. |
| Single responsibility | One client per API area, one page object per page, components for parts that are reused (dialog, table). |
| Open/closed | New endpoints mean a new client extending `BaseApiClient`. Auth, logging and evidence are inherited, not copied. |
| Liskov / interface segregation | Clients expose only their own endpoint methods. Tests depend on narrow, intention-revealing methods (`create`, `remove`, `list`). |
| Dependency inversion | Tests never build clients or pages themselves. Fixtures inject them, so setup can change in one place. |
| Encapsulation | `BaseApiClient.send()` is protected. Tests can only call meaningful operations. |
| DRY | Business rules exist once (`app/public/validation.js`, used by UI and API). The boundary data table is shared by UI-04 and API-07. Date rules are mirrored in `utils/dates.ts`. |
| Configuration management | `config/env.ts` reads `.env`. URLs, ports, credentials and the worker count are never in test code. |
| Error handling | Setup failures stop the test with a clear message (`authentication must succeed during test setup`). Assertions carry messages. Nothing is wrapped in try/catch that would hide a defect. |

### Naming conventions

- Files: `kebab-case.spec.ts` for tests, `PascalCase.ts` for classes.
- Test titles: `<ID> <behaviour in plain English> @tags`, e.g. `UI-05 ID document upload accepts PDFs up to 1 MB and rejects other files @file @validation`. The ID links to `docs/TEST_CASES.md`, and the tags allow subsets (`--grep @regression`).
- Data-driven titles include the data set: `UI-03 [DD-02] rejects fullName="R2-D2" …`, `API-07 [boundary age=17] -> 400`.
- Locators are named after what the user sees (`submitButton`, `documentStatus`), and methods after user intent (`register`, `uploadPhoto`).

## 4. Locator & synchronisation strategy

1. **Accessible roles and labels first:** `getByRole('button', { name: 'Register' })`, `getByLabel('Event date')`, `getByRole('dialog', { name: 'Confirm registration' })`. These are what real users and screen readers rely on, so they change less often than markup, and they also check accessibility.
2. **Stable IDs only where no accessible name exists**, i.e. validation messages (`#age-error`). These IDs are part of the accessibility contract because inputs reference them with `aria-describedby`.
3. **No layout-based CSS/XPath and no generated IDs.** The only XPath (`following-sibling::dd`) expresses a semantic relation (definition term → description).
4. **Rows are found by unique data (email), never by index or shared text.** This rule came out of our failure investigation (see `FAILURE_INVESTIGATION.md`).
5. **Waiting:** Playwright auto-waits for actionability, and web-first assertions (`await expect(locator).toHaveText()`) retry until the condition holds or the timeout expires. For actions that trigger an API call we wait for the actual response (`page.waitForResponse`). The server adds 400–1200 ms of random latency, so a missing wait shows up immediately. **The suite contains no `waitForTimeout` or fixed sleep.**
6. **Debugging flaky tests:** `trace: 'retain-on-failure'` stores a full trace (DOM snapshots, network, console) for every failure. Re-run with `--repeat-each=10 --workers=4` to expose timing or data conflicts, and use `--headed`/`--ui` to watch.

## 5. Independence & parallel execution

- `fullyParallel: true`: even tests in the same file run concurrently. Workers default to 4 (`WORKERS` in `.env`, `--workers` on the CLI).
- Each test requests **its own auth token** (fixture `apiToken`) and gets a fresh browser context, so there is no shared session.
- Each test creates **its own data** with `buildRegistration()`, which generates a unique email (`qa.<uuid>@eventhub.test`). The app enforces unique emails, so a collision would surface as a 409 instead of passing silently.
- **Teardown:** the `registrationApi` fixture deletes every record the test created through the API, plus every record it registered through the UI (`trackEmail`).
- Assertions on shared views (the registrations table) are always scoped to the test's own row, or to a filter on a tag unique to the test (UI-08).
- No test uses a fixed record ID or depends on execution order. Each one sets up its own preconditions through the API (fast and reliable) and verifies the result through the UI.

**Investigating a failure that happens only in parallel:** reproduce with `--workers=4 --repeat-each=5`, open the trace of the failing run, and look for shared state: a locator matching other tests' data, a fixed ID or email, or an assertion on global counts. Then check `evidence/parallel-timeline.md` to see which tests overlapped with the failing one.

## 6. Reporting

- HTML report (`reports/html`): steps, attachments and the `execution` annotation (worker and timestamps) for every test.
- Every API call made through a client is attached as JSON (request + response). `Authorization`, `password` and `token` values are replaced with `***REDACTED***`.
- JSON and JUnit reports support CI, and `scripts/parallel-timeline.mjs` builds the parallel-execution evidence from them.

## 7. "If the application changes tomorrow…"

- **A label or markup change** → one page-object line changes. Tests stay the same.
- **A business-rule change** (e.g. age limit 21) → the boundary table and messages change. The data-driven tests then cover the new limit on both UI and API automatically.
- **A new API field** → the JSON schema with `additionalProperties: false` fails immediately and names the unexpected field, so the impact is detected and not silently ignored.
- **Genuine defects vs noise:** assertions target user-visible behaviour and API contracts, not styling or timing, and synchronisation never relies on sleeps, so a failure means behaviour changed. The traces show why.
