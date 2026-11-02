import { test, expect } from '../../fixtures/test-fixtures';
import { buildRegistration } from '../../test-data/registration.factory';

/**
 * FAILURE INVESTIGATION DEMO (see docs/FAILURE_INVESTIGATION.md).
 *
 * This is the ORIGINAL version of the UI-01 table check, kept on purpose so
 * the failure can be reproduced live. It passes when run alone, but fails in
 * parallel because it locates the row by the person's name, and every test
 * uses the same default name. Skipped unless DEMO_FAILURE=1:
 *
 *   npm run test:failure-demo
 */
test.describe('Failure demo - row located by name (original, faulty locator)', () => {
  test.skip(!process.env.DEMO_FAILURE, 'Set DEMO_FAILURE=1 to reproduce the investigated failure');

  // DEMO-01 (Issraa): kept on purpose to show the bug - it fails when tests run in parallel.
  test('DEMO-01 new registration appears in the table (faulty locator) @demo', async ({ registrationPage: ui, registrationApi }) => {
    const data = buildRegistration();
    registrationApi.trackEmail(data.email);

    await ui.register(data);
    await expect(ui.notification(/Registration confirmed/)).toBeVisible();

    // ORIGINAL (faulty): matches every row whose name is "Ada Lovelace".
    const row = ui.table.root.getByRole('row', { name: new RegExp(data.fullName) });
    await expect(row).toContainText(data.email);

    // FIX used in UI-01: ui.table.rowByEmail(data.email) - email is unique per test.
  });
});
