# Test case inventory

Application: **EventHub** (local, `http://localhost:3000`) · Tool: Playwright 1.56 + TypeScript · Browser: Chromium engine (Desktop Chrome profile)

**Execution of 1 November 2026** (actual results, see `evidence/`):

| Run | Command | Result |
|---|---|---|
| Normal (1 worker) | `npm run test:serial` | **47 passed**, 1 skipped (failure demo), 37.9 s |
| Parallel (4 workers) | `npm run test:parallel` | **47 passed**, 1 skipped, 17.0 s, peak 4 tests at once |
| Stability (6 workers × 3 repeats) | `npx playwright test --workers=6 --repeat-each=3` | **141 passed**, 0 failed, 0 flaky |
| Failure demo | `npm run test:failure-demo` | Fails in parallel as intended (strict-mode violation), see `FAILURE_INVESTIGATION.md` |

Counts: **10 UI test cases + 1 failure-oriented UI case**, **8 API test cases**. Data-driven cases appear in the report once per data set (UI-03 ×7, UI-04 ×8, API-07 ×16), which is why the runner reports 47 entries.

Mandatory UI element coverage: text input (UI-01/02/03/10), number input (UI-03/04/08), text area (UI-01/08), file upload (UI-01/05), image upload (UI-01/06), dropdown (UI-01/08), date picker (UI-07), dialog (UI-01/07/09), dynamic elements (UI-01/02/08/09).

---

## UI test cases

Common precondition (except UI-10): the app is running; the fixture gets an API token and opens `/register.html` with that session already signed in.

| ID | Name | Type | Test data | Steps (summary) | Expected result | Key assertions | Status |
|---|---|---|---|---|---|---|---|
| UI-01 | Register with valid data; registration displayed and persisted | Positive, state verification, regression | Factory: "Ada Lovelace", unique email, age 36, VIP × 2, date +30 days, 2-line notes, `id-document.pdf`, `profile-photo.png` (120×80) | Fill all controls → upload PDF and PNG → Register → check modal → Confirm → reload → query API | Upload statuses shown; total €298.00; modal summarises the data; spinner then toast "Registration confirmed: EVH-XXXXXX" that disappears; form reset; row with the same values; row still there after reload; API record matches (notes, file names, image size) | `toHaveText` on statuses, dialog values and table cells; `toHaveValue('vip')`; `toBeVisible`/`toBeHidden` for spinner and toast; `toHaveCount(1)`; `toMatchObject` on API state | Pass |
| UI-02 | Empty form shows every required-field message | Negative, field validation | No input | Click Register | Alert "Please fix 5 errors before submitting"; 5 field messages; focus on Full name; no modal; message clears once corrected | Text of each message, `aria-invalid`, `toBeFocused`, dialog hidden | Pass |
| UI-03 | Invalid field values rejected with the right message (**data-driven**, `test-data/invalid-fields.json`) | Data-driven, validation, negative | DD-01 name "A" · DD-02 "R2-D2" · DD-03 email without @ · DD-04 "ada@example" · DD-05 age 25.5 · DD-06 tickets −3 · DD-07 age empty | Type the value, leave the field | Field message from the data set | Message text + `aria-invalid="true"`, one report entry per data set | Pass (7/7) |
| UI-04 | Age and tickets boundaries (**data-driven**, `test-data/boundaries.ts`) | Boundary, data-driven | Age 17/18/99/100, tickets 0/1/10/11 | Type the value, leave the field | 17, 100, 0, 11 rejected with the range message; 18, 99, 1, 10 accepted | Message text or hidden; `aria-invalid`; `min`/`max` attributes | Pass (8/8) |
| UI-05 | ID document accepts PDF up to 1 MB, rejects others | File validation, boundary | `id-document.pdf`, `meeting-notes.txt`, generated 1 MB PDF, 1 MB + 1 byte PDF | Upload each in turn | PDF: "Uploaded: id-document.pdf (0.4 KB)"; .txt: "Only PDF documents are accepted"; exactly 1 MB accepted; 1 MB + 1 rejected "Document must be 1 MB or smaller"; rejected file cleared from the input | Status/error text; `input.files.length === 0` | Pass |
| UI-06 | Profile photo accepts real PNG/JPEG, rejects invalid images | Image upload validation | 120×80 PNG, 200×150 JPEG, GIF, text file renamed `.png`, 2 MB + 1 PNG | Upload each in turn | Preview + "name · W×H px" for PNG/JPEG; GIF rejected by type; fake PNG "The file is not a valid image"; oversize rejected | Preview visibility, `naturalWidth`, messages | Pass |
| UI-07 | Event date restrictions | Date validation, boundary | Yesterday, today, +366 days, next Sunday, tomorrow (or the day after, if tomorrow is a Sunday) | Enter each date; then fill the form and open the modal | `min` = tomorrow, `max` = +365; past/today "must be in the future"; +366 "within the next 365 days"; Sunday "venue is closed"; tomorrow accepted and shown as e.g. "Mon 02 Nov 2026"; Cancel creates nothing | Attributes, messages, formatted date, API count 0 | Pass |
| UI-08 | Total price, notes counter and list filter update dynamically | Dynamic elements | Ticket/quantity combinations; 17, 500 and 501 characters; 2 registrations with a unique tag created through the API | Change ticket type/quantity; type notes; filter the list | €0 → €49 → €147 → €447 → €190; counter "17 / 500", "500 / 500" OK, "501 / 500" flagged red + error; filter shows 2 → 1 → 0 rows + "No registrations match the filter." | Text, CSS class `over`, row counts | Pass |
| UI-09 | Modal cancel and delete confirmation | Dialog handling, state verification | Factory data; one registration created through the API | Cancel the modal; delete → dismiss `confirm()`; delete → accept | Cancel: nothing created, input kept. Dismiss: row stays, API 200. Accept: toast "Registration EVH-… deleted", row removed, API 404 | Dialog type and exact message; row visibility; API status | Pass |
| UI-10 | Sign-in protects the registration page | Regression, smoke, negative | Credentials from `.env`; wrong password | Open `/register.html` signed out → empty sign-in → wrong password → valid sign-in → sign out | Redirect to sign-in; "Enter your username and password"; "Invalid username or password"; valid sign-in lands on "Event registration"; sign-out ends the session | `toHaveURL`, `toHaveTitle`, alert text, heading | Pass |
| **UI-F01** | **Duplicate email rejected (failure-oriented)** | Negative, error handling | Registration created through the API; same email in UPPER CASE | Fill the form with the duplicate → Confirm | API 409; alert "A registration with this email already exists"; email field error; no success toast; input kept; still exactly 1 record | Status 409, messages, toast count 0, API count 1 | Pass |
| DEMO-01 | Original faulty table locator (failure reproduction) | Failure demo | Factory data | Register; locate row by name | Fails in parallel with a strict-mode violation (documented) | – | Skipped by default; fails with `DEMO_FAILURE=1` (intended) |

## API test cases

Base URL `http://localhost:3000`. Auth: `Authorization: Bearer <token>`; the token comes from `POST /api/auth/token` with credentials from `.env`. Every request/response is attached to the HTML report with secrets redacted.

| ID | Name | Method & endpoint | Request | Expected | Key assertions | Status |
|---|---|---|---|---|---|---|
| API-01 | Public endpoints return the documented contract and headers | `GET /api/health`, `GET /api/ticket-types`, `GET /api/does-not-exist` | No auth | 200 + health schema; 200 + 3 ticket types with prices 49/149/19; 404 JSON | Status, `content-type: application/json`, `cache-control: no-store`, UUID `x-request-id`, no `x-powered-by`, JSON schema | Pass |
| API-02 | Tokens only for valid credentials; protected endpoints require one | `POST /api/auth/token`, `GET /api/registrations` | Valid / wrong password / missing password; no token / forged token / valid token | 200 + token schema (expires in 3600 s); 401; 400; 401 + `WWW-Authenticate: Bearer`; 401 `invalid_token`; 200 | Status, body, headers, schema | Pass |
| API-03 | Create a registration | `POST /api/registrations` | Factory payload, mixed-case email, student × 3, PDF metadata | 201, `Location` header, email lower-cased, total 57, createdAt = updatedAt; GET on `Location` returns the same | Schema (`additionalProperties: false`), header, computed fields | Pass |
| API-04 | Read by id, filter by email, unknown id | `GET /api/registrations/{id}`, `GET /api/registrations?email=` | Registration created in setup; random UUID | 200 equal to created; list total 1 with this id; 404 "Registration not found" | Equality, schema, error body | Pass |
| API-05 | Update a registration | `PUT /api/registrations/{id}` | New name, VIP × 4, new date | 200; total 596; id/reference/createdAt unchanged; updatedAt later; GET shows the change | `toMatchObject`, timestamps, persistence | Pass |
| API-06 | Delete a registration | `DELETE /api/registrations/{id}` | Registration created in setup | 204 with empty body; GET 404; second DELETE 404 | Status, empty body, error body | Pass |
| API-07 | Boundary and field validation (**data-driven**) | `POST /api/registrations` | Age 17/18/99/100, tickets 0/1/10/11; bad email, past date, today, Sunday, wrong date format, unknown ticket type, notes 501 chars, non-PDF document | Valid boundaries 201 with the value stored; invalid → 400 `Validation failed` with `{field, message}` | Error schema, exact detail entry | Pass (16/16) |
| API-08 | Error handling: duplicate, empty body, malformed JSON | `POST /api/registrations` | Same email in upper case; `{}`; `{"fullName": "Ada", ` | 409 conflict message; 400 listing the 6 required fields in order; 400 "Malformed JSON body" | Status + exact error bodies | Pass |
