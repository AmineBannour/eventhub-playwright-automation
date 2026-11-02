# EventHub – UI & API Test Automation (Team Red · Playwright + TypeScript)

JUNIA ISEN · Software Quality Assurance · UI & API Test Automation Challenge (Group A)
Team: Mohamed Amine Bannour · Lilian Clabecq · Amira Foudi · Salma El Sayed · Issraa El Aouni

This repository contains:

| Part | Where | What |
|---|---|---|
| Application under test | `app/` | **EventHub**, a small event-registration web app (sign-in, registration form, registrations list) with a JSON REST API. Built by the team so every mandatory UI control has real behaviour. |
| Automation framework | `config/ clients/ pages/ components/ fixtures/ utils/ test-data/` | Playwright Test + TypeScript, Page Object Model, API clients, custom fixtures, JSON-schema contract checks. |
| Tests | `tests/ui`, `tests/api` | 10 UI test cases + 1 failure-oriented case, 8 API test cases (data-driven cases expand into one report entry per data set). |
| Documentation | `docs/` | Test case inventory, failure investigation, architecture notes, contribution record, PowerPoint presentation. |
| Evidence | `evidence/`, `reports/` | Execution logs, parallel timeline, HTML/JSON/JUnit reports (reports are regenerated on every run). |

---

## 1. Prerequisites

- **Node.js 20 or newer** (tested with Node 26) and npm
- Windows, macOS or Linux. No database, Docker or internet access to a third-party site is needed: the app runs locally.

## 2. Installation (clean setup)

```bash
npm install
npx playwright install chromium
```

Optional – choose your own local credentials:

```bash
cp .env.example .env
```

If `npx playwright install chromium` cannot download (slow or blocked network), set `BROWSER_CHANNEL=msedge` in `.env` to use the Edge browser that ships with Windows. The recorded evidence runs used this option.

If `.env` does not exist the framework and the app fall back to `.env.example`, so a fresh clone runs straight away.
The values are **local test credentials for this demo app only**; `.env` is git-ignored and nothing secret is hard-coded in the source.

| Variable | Purpose | Default |
|---|---|---|
| `APP_PORT` | Port of the EventHub app | `3000` |
| `APP_USERNAME` / `APP_PASSWORD` | Credentials accepted by the app (used by UI login and API auth tests) | see `.env.example` |
| `APP_LATENCY_MS` | Simulated server processing time for POST/PUT (makes synchronisation matter) | `800` |
| `BASE_URL` | URL the tests target | `http://localhost:3000` |
| `WORKERS` | Default number of parallel workers | `4` |
| `BROWSER_CHANNEL` | Optional: `msedge` or `chrome` runs the UI tests on an installed browser instead of Playwright's Chromium (useful if the browser download is blocked) | empty |

## 3. Running the application

Playwright starts the app automatically (`webServer` in `playwright.config.ts`). To explore it manually:

```bash
npm run app
```

Then open <http://localhost:3000> and sign in with the credentials from `.env` / `.env.example`.

## 4. Running the tests

| Goal | Command |
|---|---|
| Everything (UI + API, parallel, default workers) | `npm test` |
| UI tests only | `npm run test:ui` |
| API tests only | `npm run test:api` |
| Normal / sequential run (1 worker) | `npm run test:serial` |
| Parallel run (4 workers) | `npm run test:parallel` |
| Any number of workers | `npx playwright test --workers=6` |
| Data-driven tests only | `npm run test:data-driven` |
| Regression subset | `npm run test:regression` |
| One test by ID | `npx playwright test -g "UI-01"` |
| Watch it in a browser | `npx playwright test --project=ui --headed --workers=1` |
| Interactive UI mode (great for the demo) | `npx playwright test --ui` |
| Reproduce the investigated failure | `npm run test:failure-demo` (expected to FAIL – see `docs/FAILURE_INVESTIGATION.md`) |
| Type-check the framework | `npm run typecheck` |

## 5. Reports and evidence

After every run:

- `reports/html/` – Playwright HTML report: every test, its steps, the API request/response JSON (secrets redacted), screenshots and traces of failures. Open it with `npm run report`.
- `reports/results.json` – machine-readable results.
- `reports/junit.xml` – JUnit format for CI tools.
- `test-results/` – screenshots + traces of failed tests (open a trace with `npx playwright show-trace <file>`).

Parallel-execution evidence:

```bash
npm run test:parallel
npm run parallel:timeline
```

This writes `evidence/parallel-timeline.md`: the worker that ran each test, start/end times, an ASCII timeline and the peak number of tests running at the same moment.

## 6. Project structure

```
app/                     Application under test (Express server + static UI)
  server.js              REST API: auth, ticket types, registrations CRUD
  public/                HTML pages, app.js, styles, validation.js (rules shared by UI and API)
config/env.ts            Environment configuration (reads .env)
clients/                 API layer: BaseApiClient (requests, auth, evidence) + Auth/Public/Registration clients
pages/                   Page objects: BasePage, LoginPage, RegistrationPage
components/              Reusable UI pieces: ConfirmDialog, RegistrationsTable
fixtures/test-fixtures.ts  Custom Playwright fixtures (token, clients, pages, automatic clean-up)
test-data/               Data factory, JSON/TS data sets for data-driven tests, upload files
utils/                   Schemas + schema assertions, date helpers, shared types
tests/ui/                UI specs (UI-01 … UI-10, UI-F01, failure demo)
tests/api/               API specs (API-01 … API-08)
scripts/                 Parallel timeline generator, test-file generators
docs/                    Test inventory, failure investigation, architecture, contributions
evidence/                Saved execution logs and parallel evidence
```

## 7. Design in one minute

- **Page Object Model** – selectors exist only in `pages/` and `components/`; tests read like the test cases (`ui.fill(data)`, `ui.submit()`, `ui.dialog.confirm()`).
- **Locators** – accessible roles and labels first (`getByRole`, `getByLabel`), stable IDs only for validation messages that are linked with `aria-describedby`. No CSS paths tied to layout, no generated IDs. Table rows are found by the test's unique email, never by position.
- **Synchronisation** – only Playwright auto-waiting and web-first assertions (`expect(locator).toHaveText(...)`), plus `waitForResponse` for API calls triggered by the UI. **No fixed sleeps** anywhere in the suite.
- **API layer** – `BaseApiClient` centralises headers, bearer auth, JSON parsing and evidence; each endpoint group has its own client (single responsibility, open for extension).
- **Contract checks** – JSON Schemas in `utils/schemas.ts`, validated with Ajv via `expectSchema()`.
- **Independence** – each test gets its own token, its own data (unique email from the factory), and its own clean-up (fixture deletes what the test created). No test relies on another test, a fixed ID or leftover data, so `fullyParallel: true` is safe.
- **Data-driven** – `test-data/invalid-fields.json` (UI-03), `test-data/boundaries.ts` (UI-04 and API-07 share it), `test-data/api-invalid-payloads.ts` (API-07). Each data set is reported as its own test with its ID in the title.

More detail: `docs/ARCHITECTURE.md`.
