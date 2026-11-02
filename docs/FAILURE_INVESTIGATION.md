# Failure investigations

We hit two genuine automation failures while building the suite. Both are documented with the logs captured at the time (`evidence/failure-investigation/`). In neither case did we change an expected result to make a test pass: each fix follows the intended behaviour of the application.

---

## Investigation 1 – API-01 failed: a faulty assertion in the JSON schema

| | |
|---|---|
| **What failed** | `API-01 GET /api/health …`, step `GET /api/health`, on the first run of the API suite (22 passed, 1 failed). |
| **How it was detected** | The schema assertion `expectSchema(body, 'health')` failed with: `data/version must match pattern "^d+.d+.d+$"`. Log: `evidence/failure-investigation/01-API-01-failing-run.log`. |
| **Category** | **Faulty assertion** (defect in our test code), not an application defect. |

### Investigation

1. **Check the real response.** The redacted request/response attachment in the HTML report shows `{"status":"ok","version":"1.0.0",…}`. `1.0.0` is a valid semantic version, so the API behaves as documented.
2. **Read the error carefully.** The pattern in the message is `^d+.d+.d+$`, but the source said `'^\d+\.\d+\.\d+$'`. The backslashes had disappeared.
3. **Root cause.** In a normal JavaScript/TypeScript string literal, `\d` is not a valid escape, so it silently becomes `d`, and `\.` becomes `.`. The schema therefore required the letter "d" repeated and separated by *any* character.
4. **Prove it.** We compared both patterns with Ajv (`evidence/failure-investigation/03-regex-verification.log`):

```text
pattern seen by Ajv (original): ^d+.d+.d+$
1.0.0    fixed: true  original: false
10.2.33  fixed: true  original: false
1.0      fixed: false  original: false
dXdXd    fixed: false  original: true
d.d.d    fixed: false  original: true
```

The original assertion **rejected every real version and accepted nonsense**, so it was wrong in both directions.

### Corrective action

`utils/schemas.ts` now writes the pattern with `String.raw`, which keeps the backslashes:

```ts
version: { type: 'string', pattern: String.raw`^\d+\.\d+\.\d+$` },
```

### Verification and prevention

- API-01 passes again (`02-API-01-after-fix.log`). The verification table shows the fixed schema still **rejects** invalid versions (`1.0`, `dXdXd`), so the fix tightened the check instead of loosening it.
- Rule added to our conventions: regex patterns inside strings are written with `String.raw` (or as a `RegExp` literal's `.source`).
- Lesson: when a contract assertion fails, check the real response before blaming the application, and test the test with a known-bad value.

---

## Investigation 2 – table check failed only in parallel: an incorrect locator

| | |
|---|---|
| **What failed** | The first version of the "new registration appears in the list" check (UI-01). It is kept as `tests/ui/failure-demo.spec.ts` so it can be reproduced live: `npm run test:failure-demo`. |
| **How it was detected** | It passes when run alone (3/3, `04-DEMO-01-serial-passes.log`), but fails intermittently with 4 workers (1 of 4 runs, `05-DEMO-01-parallel-fails.log`). It also failed when one row created earlier by hand was still on the server (`04a-…-leftover-manual-data.log`). |
| **Category** | **Incorrect locator** that showed up as a parallel-execution / test-data problem. The application behaved correctly. |

Error captured:

```text
Locator: getByRole('table', { name: 'My registrations' }).getByRole('row', { name: /Ada Lovelace/ })
Expected substring: "qa.3158670c@eventhub.test"
Error: strict mode violation: … resolved to 2 elements:
    1) <tr data-reference="EVH-B01C74">… 'EVH-B01C74 Ada Lovelace qa.'
    2) <tr data-reference="EVH-C3BE9F">… 'EVH-C3BE9F Ada Lovelace qa.'
```

### Investigation

1. **Reproduce.** Run serially, then with `--workers=4 --repeat-each=4`. It fails only when other registrations exist, which is the typical signature of shared state.
2. **Read the evidence.** Playwright's strict mode refused to choose between two rows. The failure screenshot and trace showed two rows with the same name created by two different tests at the same moment.
3. **Root cause.** The data factory gives every test the same default name, "Ada Lovelace" (only the email is unique). The locator selected the row *by name*, so as soon as a parallel test, or leftover data, added another "Ada Lovelace", it matched several rows. Using `.first()` would only have hidden the problem: the test could then have verified *another test's* row and passed for the wrong reason.

### Corrective action

Rows are located by the value that is unique to the test, its email, and matched exactly on a whole cell:

```ts
// components/RegistrationsTable.ts
rowByEmail(email: string): Locator {
  return this.dataRows().filter({ has: this.page.getByRole('cell', { name: email, exact: true }) });
}
```

UI-01 also asserts `toHaveCount(1)` on that row, which proves the registration was created exactly once.

### Verification and prevention

- Full suite: 47/47 passed with 1 worker and with 4 workers (`evidence/run-serial-1-worker.log`, `evidence/run-parallel-4-workers.log`). A stability run of every test 3 times on 6 workers gave **141 passed, 0 failed, 0 flaky** (`evidence/run-stability-6-workers-repeat3.log`).
- Framework rules added (see `ARCHITECTURE.md`):
  - Rows in shared views are always located by test-unique data, never by position or shared text.
  - Every test generates unique data through `buildRegistration()`.
  - New tests are checked with `--repeat-each` in parallel before merging.
- **How we investigate a test that fails only in parallel:** reproduce with `--workers=N --repeat-each=M`, open the trace, look for shared data (non-unique values, fixed IDs, global counts, ordering assumptions), and check `evidence/parallel-timeline.md` to see which tests overlapped with the failing one.
