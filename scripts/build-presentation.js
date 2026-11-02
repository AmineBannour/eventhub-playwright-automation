// Regenerates docs/TeamRed_EventHub_Playwright_Presentation.pptx (needs: npm i pptxgenjs; SKILL_DIR pointing at a folder with scripts/apply_theme.js).
const path = require('path');
const pptxgen = require('pptxgenjs');
const { applyTheme } = require(process.env.SKILL_DIR + '/scripts/apply_theme.js');

const ROOT = path.resolve(__dirname, '..');
const SHOT = (f) => path.join(ROOT, 'evidence/screenshots', f);
const OUT = process.env.DECK_OUT || path.join(ROOT, 'docs/TeamRed_EventHub_Playwright_Presentation.pptx');

const THEME = {
  name: 'Team Red',
  headFontFace: 'Cambria',
  bodyFontFace: 'Calibri',
  colors: {
    dk1: '1D2433', lt1: 'FFFFFF', dk2: '7A1B24', lt2: 'F3F4F7',
    accent1: 'C62F3A', accent2: '1D2433', accent3: '2E7D5B', accent4: 'E8A33D', accent5: '5D6679', accent6: '9E1F29',
    hlink: 'C62F3A', folHlink: '9E1F29',
  },
};
const HEX = THEME.colors;

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5
pres.title = 'EventHub - UI & API Test Automation with Playwright';
pres.author = 'Team Red';
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;

// ---------- layouts ----------
pres.defineSlideMaster({
  title: 'Dark Title',
  background: { color: C.text1 },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.8, y: 2.2, w: 11.7, h: 1.6, fontSize: 44, bold: true, color: C.background1, fontFace: THEME.headFontFace, valign: 'bottom', align: 'left' }, text: '' } },
    { placeholder: { options: { name: 'body', type: 'body', x: 0.8, y: 3.95, w: 11.7, h: 1.2, fontSize: 20, color: C.background2, valign: 'top', align: 'left' }, text: '' } },
  ],
});
pres.defineSlideMaster({
  title: 'Content',
  background: { color: C.background1 },
  margin: [0.5, 0.6, 0.6, 0.6],
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 0.35, w: 12.1, h: 0.85, fontSize: 32, bold: true, color: C.text1, fontFace: THEME.headFontFace, valign: 'middle', align: 'left', margin: 0 }, text: '' } },
    { text: { text: 'Team Red · EventHub · Playwright + TypeScript', options: { x: 0.6, y: 7.0, w: 8, h: 0.3, fontSize: 10, color: C.accent5, margin: 0 } } },
  ],
  slideNumber: { x: 12.2, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: C.accent5, align: 'right' },
});

// ---------- helpers ----------
let id = 0;
const nm = (s) => `${s}-${++id}`;

function content(title, section, notes) {
  const s = pres.addSlide({ masterName: 'Content', sectionTitle: section });
  s.addText(title, { placeholder: 'title' });
  if (notes) s.addNotes(notes);
  return s;
}

/** Red numbered / lettered circle - the deck's motif. */
function badge(s, x, y, label, d = 0.5, fill = C.accent1) {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill }, objectName: nm('badge') });
  s.addText(label, { x, y, w: d, h: d, fontSize: d > 0.6 ? 18 : 14, bold: true, color: C.background1, align: 'center', valign: 'middle', margin: 0, isTextBox: true, objectName: nm('badge-text') });
}

function card(s, x, y, w, h, head, body, opts = {}) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: 0.08, fill: { color: opts.fill || C.background2 }, line: { color: opts.fill || C.background2 }, objectName: nm('card'),
  });
  const pad = 0.2;
  let top = y + pad;
  if (opts.badge) {
    badge(s, x + pad, top, opts.badge);
    s.addText(head, { x: x + pad + 0.65, y: top, w: w - 2 * pad - 0.65, h: 0.5, fontSize: 17, bold: true, color: opts.headColor || C.text1, valign: 'middle', margin: 0, isTextBox: true, objectName: nm('card-head') });
  } else {
    s.addText(head, { x: x + pad, y: top, w: w - 2 * pad, h: 0.45, fontSize: 17, bold: true, color: opts.headColor || C.text1, valign: 'middle', margin: 0, isTextBox: true, objectName: nm('card-head') });
  }
  top += opts.badge ? 0.65 : 0.55;
  const runs = Array.isArray(body)
    ? body.map((t, i) =>
        typeof t === 'string'
          ? { text: t, options: { bullet: { indent: 14 }, breakLine: i < body.length - 1, paraSpaceAfter: 4 } }
          : { text: t.text, options: { breakLine: i < body.length - 1, ...(t.options || {}) } },
      )
    : body;
  s.addText(runs, { x: x + pad, y: top, w: w - 2 * pad, h: y + h - top - pad, fontSize: opts.size || 14, color: opts.bodyColor || C.text1, valign: 'top', margin: 0, isTextBox: true, objectName: nm('card-body') });
}

function stat(s, x, y, w, value, label, color = C.accent1) {
  s.addText(value, { x, y, w, h: 0.95, fontSize: 48, bold: true, color, fontFace: THEME.headFontFace, margin: 0, isTextBox: true, objectName: nm('stat') });
  s.addText(label, { x, y: y + 0.95, w, h: 0.55, fontSize: 13, color: C.accent5, margin: 0, valign: 'top', isTextBox: true, objectName: nm('stat-label') });
}

function table(s, rows, x, y, w, colW, fontSize = 12, rowH) {
  const header = rows[0].map((t) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: C.text1 } } }));
  const body = rows.slice(1).map((r, i) =>
    r.map((t) => {
      const pass = t === 'Pass' || /^Pass/.test(t);
      return { text: t, options: { fill: { color: i % 2 ? C.background1 : C.background2 }, color: pass ? C.accent3 : C.text1, bold: pass } };
    }),
  );
  s.addTable([header, ...body], { x, y, w, colW, fontSize, fontFace: THEME.bodyFontFace, border: { type: 'solid', pt: 0.5, color: 'D8DCE6' }, margin: [3, 6, 3, 6], valign: 'middle', ...(rowH ? { rowH } : {}), objectName: nm('table') });
}

function image(s, file, x, y, w, h, alt) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x - 0.06, y: y - 0.06, w: w + 0.12, h: h + 0.12, rectRadius: 0.06, fill: { color: C.background2 }, line: { color: 'D8DCE6', width: 0.75 }, shadow: { type: 'outer', blur: 6, offset: 2, angle: 90, color: '000000', opacity: 0.18 }, objectName: nm('frame') });
  s.addImage({ path: file, x, y, w, h, altText: alt, objectName: nm('shot') });
}

// =============================== SLIDES ===============================

pres.addSection({ title: 'Introduction' });
// 1 - Title
{
  const s = pres.addSlide({ masterName: 'Dark Title', sectionTitle: 'Introduction' });
  s.addText('EventHub: UI & API Test Automation', { placeholder: 'title' });
  s.addText('Team Red · Playwright + TypeScript · JUNIA ISEN · Software Quality Assurance · 2 November 2026', { placeholder: 'body' });
  const names = ['Mohamed Amine Bannour', 'Lilian Clabecq', 'Amira Foudi', 'Salma El Sayed', 'Issraa El Aouni'];
  names.forEach((n, i) => {
    badge(s, 0.8 + i * 2.4, 5.6, n.split(' ').filter((p) => p.length > 2).map((p) => p[0]).slice(0, 2).join(''), 0.55);
    s.addText(n, { x: 1.45 + i * 2.4, y: 5.55, w: 1.7, h: 0.65, fontSize: 13, color: C.background1, valign: 'middle', margin: 0, isTextBox: true, objectName: nm('member') });
  });
  s.addNotes('Presenter: Amine. Introduce the team (Team Red, assigned Playwright), the project goal: a maintainable UI + API automation framework that another QA engineer could run and extend.');
}

// 2 - Results at a glance
{
  const s = content('Results at a glance: 47/47 passing, serial and parallel', 'Introduction',
    'Presenter: Amine. Headline numbers from the real runs on 1 November 2026. Data-driven cases expand into 47 report entries. Stability run: every test 3 times on 6 workers, 141 passed, 0 flaky.');
  stat(s, 0.6, 1.5, 2.9, '10 + 1', 'UI test cases + 1 failure-oriented case');
  stat(s, 3.7, 1.5, 2.9, '8', 'API test cases (CRUD, auth, contract, errors)');
  stat(s, 6.8, 1.5, 2.9, '47 / 47', 'report entries passed, 1 worker and 4 workers', C.accent3);
  stat(s, 9.9, 1.5, 2.9, '0 flaky', '141 runs: 6 workers × 3 repeats', C.accent3);
  card(s, 0.6, 3.6, 5.9, 3.1, 'What we built', [
    'EventHub: our own registration app (UI + REST API) with every mandatory control doing real work',
    'A layered Playwright framework: POM, API clients, fixtures, JSON-schema contracts',
    'Evidence: HTML/JSON/JUnit reports, redacted API logs, parallel timeline',
  ]);
  card(s, 6.8, 3.6, 5.9, 3.1, 'What we will show live', [
    'UI and API suites running, serially and in parallel',
    'Data-driven tests: one report entry per data set',
    'Two real failures: root cause, fix and prevention',
  ]);
}

// 3 - Application
{
  const s = content('Application under test: EventHub, built for testability', 'Introduction',
    'Presenter: Amine. YouTube (assignments 1 and 2) has no upload, date picker or number input for signed-out users, and its terms forbid automation. Public demo sites were unreachable from our network and do not reject bad images or restrict dates. The assignment explicitly allows an app developed by the team. Runs offline: npm run app.');
  image(s, SHOT('04-confirm-dialog.png'), 0.7, 1.45, 6.2, 4.36, 'EventHub registration form with the confirmation dialog open');
  s.addText('Confirmation dialog over the filled registration form', { x: 0.7, y: 5.95, w: 6.2, h: 0.35, fontSize: 11, italic: true, color: C.accent5, margin: 0, isTextBox: true });
  const items = [
    ['Text & number', 'Name, email, age 18–99, tickets 1–10'],
    ['Text area', 'Multi-line notes, live counter, 500 limit'],
    ['File & image', 'PDF ≤ 1 MB; PNG/JPEG ≤ 2 MB, decoded'],
    ['Dropdown & date', 'Ticket type → price; tomorrow…+365, no Sundays'],
    ['Dialog & dynamic', 'Modal + confirm(); spinner, toasts, filter'],
    ['REST API', 'Bearer auth, CRUD, 400/401/404/409, schema'],
  ];
  items.forEach(([h, b], i) => {
    const y = 1.45 + i * 0.86;
    badge(s, 7.4, y + 0.05, String(i + 1), 0.5);
    s.addText(h, { x: 8.05, y, w: 4.7, h: 0.36, fontSize: 16, bold: true, color: C.text1, margin: 0, isTextBox: true });
    s.addText(b, { x: 8.05, y: y + 0.36, w: 4.7, h: 0.36, fontSize: 14, color: C.accent5, margin: 0, isTextBox: true });
  });
}

// 4 - Tool & language
{
  const s = content('Playwright with TypeScript: why this language', 'Introduction',
    'Presenter: Amine. Assigned tool: Playwright (Team Red). We chose TypeScript over Python/Java/C#. Justify with technical suitability, maintainability, team experience, ecosystem.');
  const reasons = [
    ['T', 'Technical fit', 'Playwright is written in TypeScript; its test runner, fixtures, projects and parallel workers are first-class in TS.'],
    ['M', 'Maintainability', 'Static types catch a broken page-object call or a wrong payload at compile time (npm run typecheck), not mid-run.'],
    ['E', 'Team experience', 'Everyone knows JavaScript from web courses; TypeScript adds safety without a new paradigm.'],
    ['S', 'Ecosystem', 'Ajv for JSON Schema, dotenv for config, the same language as the app under test.'],
  ];
  reasons.forEach(([b, h, t], i) => {
    const x = 0.6 + (i % 2) * 6.2, y = 1.5 + Math.floor(i / 2) * 2.6;
    card(s, x, y, 5.9, 2.3, h, [{ text: t }], { badge: b, size: 15 });
  });
}

pres.addSection({ title: 'Framework' });
// 5 - Architecture
{
  const s = content('Framework architecture: tests say what, layers say how', 'Framework',
    'Presenter: Lilian. Walk the layers top to bottom. Tests never touch selectors or raw HTTP. Fixtures inject clients and pages (dependency inversion) and clean up afterwards.');
  const box = (x, y, w, h, head, sub, fill, txt) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: fill }, objectName: nm('arch') });
    s.addText([{ text: head, options: { bold: true, fontSize: 16, breakLine: true } }, { text: sub, options: { fontSize: 12 } }], { x: x + 0.15, y, w: w - 0.3, h, color: txt, valign: 'middle', margin: 0, isTextBox: true, objectName: nm('arch-text') });
  };
  box(0.6, 1.5, 7.6, 0.9, 'tests/ui · tests/api', 'Scenarios and assertions only: UI-01…UI-10, UI-F01, API-01…API-08', C.text1, C.background1);
  box(0.6, 2.6, 7.6, 0.9, 'fixtures/test-fixtures.ts', 'Per-test token, clients, pages, automatic clean-up, execution trace', C.accent1, C.background1);
  box(0.6, 3.7, 3.7, 1.1, 'pages/ + components/', 'BasePage, LoginPage, RegistrationPage, ConfirmDialog, RegistrationsTable', C.background2, C.text1);
  box(4.5, 3.7, 3.7, 1.1, 'clients/', 'BaseApiClient → Auth, Public, Registration clients', C.background2, C.text1);
  box(0.6, 5.0, 3.7, 1.1, 'test-data/', 'Factory, JSON/TS data sets, upload files', C.background2, C.text1);
  box(4.5, 5.0, 3.7, 1.1, 'utils/ + config/', 'JSON schemas (Ajv), date rules, types, env.ts', C.background2, C.text1);
  s.addText([
    { text: 'Project structure', options: { bold: true, fontSize: 16, breakLine: true } },
    { text: 'app/            application under test\nconfig/         environment (.env)\nclients/        API layer\npages/          page objects\ncomponents/     reusable UI parts\nfixtures/       setup & teardown\ntest-data/      data sets & files\nutils/          schemas, assertions\ntests/ui  tests/api\nscripts/        evidence tooling\ndocs/  evidence/  reports/', options: { fontFace: 'Courier New', fontSize: 12 } },
  ], { x: 8.6, y: 1.5, w: 4.1, h: 4.6, color: C.text1, valign: 'top', margin: 0.15, fill: { color: C.background2 }, isTextBox: true, objectName: nm('tree') });
}

// 6 - Principles & naming
{
  const s = content('Design principles and naming conventions', 'Framework',
    'Presenter: Lilian. Give one concrete example per principle. Naming: IDs in titles link to the test inventory; tags drive subsets such as --grep @regression.');
  table(s, [
    ['Principle', 'Where you can see it'],
    ['Page Object Model', 'Selectors only in pages/ and components/; a UI change touches one file'],
    ['Single responsibility', 'One client per API area, one page object per page, components for dialog and table'],
    ['Open / closed', 'New endpoint = new client extending BaseApiClient; auth and evidence inherited'],
    ['Dependency inversion', 'Tests receive clients and pages from fixtures, never build them'],
    ['Encapsulation', 'BaseApiClient.send() is protected; tests call create / list / remove'],
    ['DRY', 'Rules shared by UI and API; one boundary table feeds UI-04 and API-07'],
    ['Configuration', 'config/env.ts reads .env; no URLs or credentials in test code'],
  ], 0.6, 1.5, 7.5, [2.3, 5.2], 13);
  card(s, 8.4, 1.5, 4.3, 5.1, 'Naming conventions', [
    'Test title: <ID> <behaviour> @tags',
    'e.g. UI-05 ID document upload accepts PDFs up to 1 MB… @file',
    'Data sets in the title: UI-03 [DD-02], API-07 [boundary age=17]',
    'Files: kebab-case.spec.ts; classes PascalCase.ts',
    'Locators named after what users see: submitButton, documentStatus',
    'Methods named after intent: register(), uploadPhoto()',
  ], { size: 14 });
}

pres.addSection({ title: 'Testing' });
// 7 - API coverage
{
  const s = content('API automation: 8 cases, contract to error handling', 'Testing',
    'Presenter: Lilian. Every call goes through BaseApiClient, which attaches the request and response to the HTML report with Authorization, password and token redacted. Show one attachment live.');
  table(s, [
    ['ID', 'Endpoint(s)', 'Checks', 'Result'],
    ['API-01', 'GET /health, /ticket-types', 'Schema, content-type, no-store, request id', 'Pass'],
    ['API-02', 'POST /auth/token', '200 / 401 / 400; 401 without or with forged token', 'Pass'],
    ['API-03', 'POST /registrations', '201, Location, schema, server-computed total', 'Pass'],
    ['API-04', 'GET /registrations/{id}', 'Equality, email filter, 404', 'Pass'],
    ['API-05', 'PUT /registrations/{id}', 'Updated fields, timestamps, persisted', 'Pass'],
    ['API-06', 'DELETE /registrations/{id}', '204 empty, then 404 twice', 'Pass'],
    ['API-07', 'POST (data-driven ×16)', 'Boundaries and invalid fields → field errors', 'Pass 16/16'],
    ['API-08', 'POST error handling', '409 duplicate, 400 empty, malformed JSON', 'Pass'],
  ], 0.6, 1.45, 12.1, [1.0, 3.2, 6.4, 1.5], 13);
  card(s, 0.6, 5.0, 5.9, 1.7, 'Contract testing', [{ text: 'JSON Schemas with additionalProperties: false: an unexpected or renamed field fails the test and names the field.' }], { size: 14 });
  card(s, 6.8, 5.0, 5.9, 1.7, 'No secrets in code or reports', [{ text: 'Credentials come from .env (git-ignored); evidence replaces auth values with ***REDACTED***.' }], { size: 14 });
}

// 8 - UI coverage
{
  const s = content('UI automation: 10 cases + 1 failure-oriented, all passing', 'Testing',
    'Presenter: Amira. Point at UI-01 as the end-to-end flow. Assertions are web-first and retried automatically. Durations from the parallel run.');
  table(s, [
    ['ID', 'Scenario', 'Result'],
    ['UI-01', 'Valid registration → dialog → toast → row → reload → API', 'Pass'],
    ['UI-02', 'Empty form: 5 required messages, focus, no dialog', 'Pass'],
    ['UI-03', 'Invalid values (data-driven ×7)', 'Pass 7/7'],
    ['UI-04', 'Age / tickets boundaries (data-driven ×8)', 'Pass 8/8'],
    ['UI-05', 'PDF accepted, .txt and > 1 MB rejected', 'Pass'],
    ['UI-06', 'PNG/JPEG preview; GIF, fake PNG, > 2 MB rejected', 'Pass'],
    ['UI-07', 'Date window, Sunday rule, formatted date', 'Pass'],
    ['UI-08', 'Price, counter, list filter update live', 'Pass'],
    ['UI-09', 'Modal cancel; confirm() dismiss / accept', 'Pass'],
    ['UI-10', 'Sign-in guard, wrong password, sign-out', 'Pass'],
    ['UI-F01', 'Duplicate email → 409 shown to the user', 'Pass'],
  ], 0.6, 1.45, 7.4, [0.9, 5.3, 1.2], 12);
  image(s, SHOT('05-registered-toast-and-list.png'), 8.4, 1.45, 4.3, 3.42, 'Registrations list with success toast');
  s.addText('Assertions check what users see: messages, values, upload status, dialog content, URL, title, and the record in the API.', { x: 8.4, y: 5.1, w: 4.3, h: 1.5, fontSize: 14, color: C.text1, margin: 0, valign: 'top', isTextBox: true });
}

// 9 - Locators & sync
{
  const s = content('Locators and synchronisation: stable selectors, no sleeps', 'Testing',
    'Presenter: Amira. The server adds 400 to 1200 ms of random latency on purpose, so any missing wait shows up immediately. There is not a single waitForTimeout in the test suite.');
  card(s, 0.6, 1.5, 5.9, 5.1, 'How we find elements', [
    'Roles and labels first: getByRole("button", { name: "Register" }), getByLabel("Event date")',
    'Stable IDs only for validation messages linked by aria-describedby',
    'No layout-based CSS/XPath, no generated IDs',
    'Rows located by the test\'s unique email, never by index or shared text',
  ], { badge: '1', size: 15 });
  card(s, 6.8, 1.5, 5.9, 5.1, 'How we wait', [
    'Playwright auto-waiting before every action',
    'Web-first assertions retry until true: expect(locator).toHaveText()',
    'waitForResponse for API calls triggered by the UI',
    'Trace kept on failure: DOM snapshots, network, console',
    'Flaky hunt: --repeat-each=10 --workers=4',
  ], { badge: '2', size: 15 });
}

// 10 - Strategy
{
  const s = content('Test coverage: every required test type is covered', 'Testing',
    'Presenter: Amira. Recap after the UI and API slides: map each required type to test IDs. Strategy: preconditions through the API (fast, reliable), behaviour verified through the UI, state double-checked through the API.');
  table(s, [
    ['Test type', 'UI', 'API'],
    ['Positive', 'UI-01', 'API-03, API-05'],
    ['Negative', 'UI-02, UI-03, UI-10, UI-F01', 'API-02, API-07, API-08'],
    ['Boundary', 'UI-04, UI-05, UI-07', 'API-07'],
    ['Field / data validation', 'UI-02, UI-03', 'API-07'],
    ['File & image validation', 'UI-05, UI-06', 'API-07 (non-PDF)'],
    ['Date validation', 'UI-07', 'API-07 (past, today, Sunday)'],
    ['Dynamic elements', 'UI-08 (+ UI-01 spinner/toast)', '–'],
    ['Dialog handling', 'UI-09 (+ UI-01, UI-07)', '–'],
    ['State verification', 'UI-01, UI-09', 'API-05, API-06'],
    ['Regression / smoke', 'UI-01, UI-10', 'API-01'],
    ['Schema, headers, auth, CRUD', '–', 'API-01…API-06'],
  ], 0.6, 1.45, 8.2, [2.8, 2.9, 2.5], 13);
  card(s, 9.1, 1.45, 3.6, 5.2, 'Approach', [
    'Arrange through the API: fast, no UI flakiness',
    'Act and assert through the UI like a user',
    'Confirm state through the API',
    'Assert behaviour, never just that something "is clickable"',
  ], { size: 14 });
}

// 11 - Data-driven
{
  const s = content('Data-driven testing: one test, many data sets', 'Testing',
    'Presenter: Salma. Show invalid-fields.json, then the for-loop in form-validation.spec.ts, then the report where each data set is its own entry with its ID. Run: npm run test:data-driven.');
  s.addText([
    { text: 'test-data/invalid-fields.json', options: { bold: true, breakLine: true } },
    { text: '{ "id": "DD-02", "field": "fullName",\n  "value": "R2-D2",\n  "expectedError": "Full name may only contain\n   letters, spaces, hyphens and apostrophes" }\n\n', options: { fontFace: 'Courier New', fontSize: 12, breakLine: true } },
    { text: 'tests/ui/form-validation.spec.ts', options: { bold: true, breakLine: true } },
    { text: 'for (const row of invalidFields) {\n  test(`UI-03 [${row.id}] rejects ...`, async ({ registrationPage: ui }) => {\n    await ui.enterAndBlur(row.field, row.value);\n    await expect(ui.fieldError(row.field))\n      .toHaveText(row.expectedError);\n  });\n}', options: { fontFace: 'Courier New', fontSize: 12 } },
  ], { x: 0.6, y: 1.5, w: 6.6, h: 5.1, fontSize: 14, color: C.text1, fill: { color: C.background2 }, margin: 0.2, valign: 'top', isTextBox: true, objectName: nm('code') });
  const sets = [
    ['UI-03', '7 data sets', 'JSON file: invalid names, emails, age, tickets'],
    ['UI-04', '8 data sets', 'Boundary table: 17/18/99/100, 0/1/10/11'],
    ['API-07', '16 data sets', 'Same boundary table + 8 invalid payloads'],
  ];
  sets.forEach(([idt, n, d], i) => {
    const y = 1.5 + i * 1.75;
    badge(s, 7.6, y, idt.replace('UI-0', 'U').replace('API-0', 'A'), 0.75);
    s.addText(`${idt} · ${n}`, { x: 8.55, y, w: 4.2, h: 0.4, fontSize: 17, bold: true, color: C.text1, margin: 0, isTextBox: true });
    s.addText(d, { x: 8.55, y: y + 0.42, w: 4.2, h: 0.7, fontSize: 14, color: C.accent5, margin: 0, valign: 'top', isTextBox: true });
  });
}

pres.addSection({ title: 'Parallel & failures' });
// 12 - Parallel
{
  const s = content('Independent tests: 2.2× faster in parallel, zero conflicts', 'Parallel & failures',
    'Presenter: Salma. fullyParallel: true. Same 47 tests: 37.9 s on 1 worker vs 17.0 s on 4 workers, peak 4 tests at once (evidence/parallel-timeline.md). Isolation: own token, unique email per test, fixture clean-up, no fixed IDs, shared views scoped to own data.');
  s.addChart(pres.charts.BAR, [{ name: 'Wall-clock time (s)', labels: ['1 worker', '4 workers'], values: [37.9, 17.0] }], {
    x: 0.6, y: 1.45, w: 5.6, h: 4.2, barDir: 'bar', chartColors: [HEX.accent5, HEX.accent1],
    showTitle: true, title: 'Full suite, 47 tests: wall-clock seconds', titleFontSize: 14, titleColor: HEX.dk1, titleFontFace: '+mn-lt',
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFontSize: 14, dataLabelColor: HEX.dk1, dataLabelFontFace: '+mn-lt', dataLabelFormatCode: '0.0" s"',
    catAxisLabelColor: HEX.accent5, catAxisLabelFontSize: 13, catAxisLabelFontFace: '+mn-lt', valAxisHidden: true, valAxisMaxVal: 46, valAxisMinVal: 0,
    valGridLine: { style: 'none' }, catGridLine: { style: 'none' }, showLegend: false, varyColors: true,
  });
  s.addText('Stability: 141 runs (6 workers × 3 repeats), 0 failed, 0 flaky', { x: 0.6, y: 5.8, w: 5.6, h: 0.8, fontSize: 14, italic: true, color: C.accent3, margin: 0, isTextBox: true });
  const rules = [
    ['Own session', 'Each test requests its own token and browser context'],
    ['Own data', 'Factory makes a unique email; duplicates fail loudly (409)'],
    ['Own clean-up', 'Fixture deletes every record the test created, API or UI'],
    ['No shared state', 'No fixed IDs, no execution order, no global counts'],
  ];
  rules.forEach(([h, b], i) => {
    const y = 1.45 + i * 1.3;
    badge(s, 6.7, y + 0.05, String(i + 1), 0.5);
    s.addText(h, { x: 7.35, y, w: 5.3, h: 0.4, fontSize: 16, bold: true, color: C.text1, margin: 0, isTextBox: true });
    s.addText(b, { x: 7.35, y: y + 0.42, w: 5.3, h: 0.6, fontSize: 14, color: C.accent5, margin: 0, valign: 'top', isTextBox: true });
  });
}

// 13 - Challenges
{
  const s = content('Challenges we hit and how we solved them', 'Parallel & failures',
    'Presenter: Salma. Be honest about each obstacle and the decision it led to.');
  const ch = [
    ['App choice', 'YouTube and public demo sites lacked required controls or were unreachable', 'Built EventHub: every control does real work and it runs offline'],
    ['Async UI', 'Spinner, toasts and API latency made timing matter', 'Web-first assertions + waitForResponse; no sleeps'],
    ['Shared table', 'Parallel tests all write to the same list', 'Unique email per test, rows located by email'],
    ['Changing dates', 'Fixed dates expire; Sundays are forbidden', 'Dates computed from today with the app\'s own rules'],
    ['Browser download', 'Chromium download stalled on our network', 'BROWSER_CHANNEL=msedge option to use an installed browser'],
  ];
  table(s, [['Challenge', 'Problem', 'Resolution'], ...ch], 0.6, 1.5, 12.1, [2.2, 4.8, 5.1], 16, 0.85);
}

// 14 - Failure 1
{
  const s = content('Failure 1: the schema, not the API, was wrong', 'Parallel & failures',
    'Presenter: Issraa. Category: faulty assertion. We did not loosen the expectation; the fixed pattern still rejects bad versions (1.0, dXdXd). Logs in evidence/failure-investigation/01-03.');
  const steps = [
    ['Detected', 'API-01 failed: version must match pattern "^d+.d+.d+$". The real response was "1.0.0", which is valid.'],
    ['Root cause', 'In a JS string, "\\d" silently becomes "d". The schema demanded letters "d" and accepted anything as separators.'],
    ['Fix', 'pattern: String.raw`^\\d+\\.\\d+\\.\\d+$` keeps the backslashes.'],
    ['Prevention', 'Regex in strings always via String.raw; test the test with a known-bad value.'],
  ];
  steps.forEach(([h, b], i) => {
    const y = 1.5 + i * 1.28;
    badge(s, 0.6, y, String(i + 1), 0.5);
    s.addText(h, { x: 1.25, y: y - 0.02, w: 5.6, h: 0.4, fontSize: 16, bold: true, color: C.text1, margin: 0, isTextBox: true });
    s.addText(b, { x: 1.25, y: y + 0.38, w: 5.6, h: 0.8, fontSize: 14, color: C.accent5, margin: 0, valign: 'top', isTextBox: true });
  });
  table(s, [
    ['Value', 'Fixed pattern', 'Original pattern'],
    ['1.0.0', 'accepted', 'rejected ✗'],
    ['10.2.33', 'accepted', 'rejected ✗'],
    ['1.0', 'rejected', 'rejected'],
    ['dXdXd', 'rejected', 'accepted ✗'],
    ['d.d.d', 'rejected', 'accepted ✗'],
  ], 7.3, 1.5, 5.4, [1.6, 1.9, 1.9], 14);
  s.addText('The original check failed both ways: it rejected every real version and accepted nonsense.', { x: 7.3, y: 4.6, w: 5.4, h: 1.0, fontSize: 14, italic: true, color: C.accent1, margin: 0, isTextBox: true });
}

// 15 - Failure 2
{
  const s = content('Failure 2: passed alone, failed in parallel', 'Parallel & failures',
    'Presenter: Issraa. Category: incorrect locator showing up as a parallel / test-data problem. .first() would have hidden it and could verify another test\'s row. Reproduce live: npm run test:failure-demo.');
  s.addText([
    { text: 'Original locator (row found by name)', options: { bold: true, breakLine: true, fontSize: 14 } },
    { text: "getByRole('row', { name: /Ada Lovelace/ })", options: { fontFace: 'Courier New', fontSize: 13, breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 8 } },
    { text: 'Error with 4 workers', options: { bold: true, breakLine: true, fontSize: 14, color: C.accent1 } },
    { text: 'strict mode violation: … resolved to 2 elements:\n 1) EVH-B01C74 Ada Lovelace qa.…\n 2) EVH-C3BE9F Ada Lovelace qa.…', options: { fontFace: 'Courier New', fontSize: 12, breakLine: true } },
    { text: ' ', options: { breakLine: true, fontSize: 8 } },
    { text: 'Fix: locate by the test\'s unique email', options: { bold: true, breakLine: true, fontSize: 14, color: C.accent3 } },
    { text: "rows.filter({ has: getByRole('cell',\n  { name: email, exact: true }) })", options: { fontFace: 'Courier New', fontSize: 13 } },
  ], { x: 0.6, y: 1.5, w: 6.6, h: 5.1, color: C.text1, fill: { color: C.background2 }, margin: 0.2, valign: 'top', isTextBox: true, objectName: nm('code') });
  stat(s, 7.6, 1.5, 2.4, '3/3', 'passed alone (1 worker)', C.accent3);
  stat(s, 10.2, 1.5, 2.5, '1 of 4', 'failed with 4 workers', C.accent1);
  card(s, 7.6, 3.4, 5.1, 3.2, 'Root cause → prevention', [
    'Every test uses the default name "Ada Lovelace"; only the email is unique',
    'Fixed in RegistrationsTable.rowByEmail(), plus toHaveCount(1)',
    'Rule: shared views are always scoped to test-unique data',
    'Verified: 47/47 on 4 workers, 141/141 on 6 × 3',
  ], { size: 14 });
}

pres.addSection({ title: 'Wrap-up' });
// 16 - Contributions
{
  const s = content('Individual contributions', 'Wrap-up',
    'Presenter: Issraa. She summarises what each member did; everyone owns 4 tests. Edit this slide if your real split differs - the instructor requires explicit individual contributions.');
  const people = [
    ['MA', 'Mohamed Amine Bannour', 'QA lead · architecture', 'App, config, fixtures · Tests: UI-01, UI-10, API-01, API-02'],
    ['LC', 'Lilian Clabecq', 'API automation', 'API clients, schemas, assertions · Tests: API-03, API-04, API-05, API-06'],
    ['AF', 'Amira Foudi', 'UI page objects & controls', 'Pages, components · Tests: UI-05, UI-06, UI-08, UI-09'],
    ['SE', 'Salma El Sayed', 'Test data, data-driven & parallel', 'Factory, data sets, parallel isolation · Tests: UI-02, UI-03, UI-04, API-07'],
    ['IE', 'Issraa El Aouni', 'Reporting & failure analysis', 'Failure investigations, reports, docs · Tests: UI-07, UI-F01, API-08, DEMO-01'],
  ];
  people.forEach(([ini, n, role, work], i) => {
    const y = 1.45 + i * 1.07;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y, w: 12.1, h: 0.92, rectRadius: 0.08, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: nm('person') });
    badge(s, 0.8, y + 0.16, ini, 0.6);
    s.addText(n, { x: 1.6, y: y + 0.08, w: 3.6, h: 0.4, fontSize: 16, bold: true, color: C.text1, margin: 0, isTextBox: true });
    s.addText(role, { x: 1.6, y: y + 0.46, w: 3.6, h: 0.36, fontSize: 13, color: C.accent1, margin: 0, isTextBox: true });
    s.addText(work, { x: 5.3, y, w: 7.2, h: 0.92, fontSize: 14, color: C.text1, valign: 'middle', margin: 0, isTextBox: true });
  });
}

// 17 - Lessons & closing (dark)
{
  const s = pres.addSlide({ masterName: 'Dark Title', sectionTitle: 'Wrap-up' });
  s.addText('Lessons learned', { x: 0.8, y: 0.6, w: 11.7, h: 0.9, fontSize: 36, bold: true, color: C.background1, fontFace: THEME.headFontFace, margin: 0, isTextBox: true });
  const lessons = [
    ['Check the response first', 'A failing contract test can be a broken test: test the test'],
    ['Parallel exposes hidden coupling', 'Run new tests with --repeat-each before trusting them'],
    ['Design data for isolation', 'Unique data and clean-up make parallel runs safe'],
  ];
  lessons.forEach(([h, b], i) => {
    const x = 0.8 + i * 4.0;
    badge(s, x, 1.85, String(i + 1), 0.6);
    s.addText(h, { x, y: 2.6, w: 3.6, h: 0.75, fontSize: 18, bold: true, color: C.background1, margin: 0, valign: 'top', isTextBox: true });
    s.addText(b, { x, y: 3.35, w: 3.6, h: 0.9, fontSize: 14, color: C.background2, margin: 0, valign: 'top', isTextBox: true });
  });
  s.addText('Next improvements', { x: 0.8, y: 4.65, w: 11.7, h: 0.5, fontSize: 20, bold: true, color: C.background1, margin: 0, isTextBox: true });
  s.addText([
    { text: 'Run the suite in CI (GitHub Actions) on every push, sharded across machines', options: { bullet: true, breakLine: true } },
    { text: 'Add Firefox and WebKit projects and accessibility checks (axe-core)', options: { bullet: true, breakLine: true } },
    { text: 'Visual regression snapshots for the form and dialog', options: { bullet: true } },
  ], { x: 0.8, y: 5.2, w: 11.7, h: 1.4, fontSize: 15, color: C.background2, margin: 0, valign: 'top', paraSpaceAfter: 4, isTextBox: true });
  s.addText('Thank you · Questions?', { x: 0.8, y: 6.75, w: 11.7, h: 0.45, fontSize: 16, italic: true, color: C.accent4, margin: 0, isTextBox: true });
  s.addNotes('Presenter: Issraa. Answer the final challenge question: if the app changes tomorrow, a label change touches one page object; a rule change updates the data tables; a new API field is caught by the strict schema. Then open for questions.');
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log('written', OUT);
})();
