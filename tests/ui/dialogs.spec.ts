import { test, expect } from '../../fixtures/test-fixtures';
import { buildRegistration } from '../../test-data/registration.factory';

test.describe('Dialogs', () => {
  // UI-09 (Amira): two kinds of popups - our confirmation popup and the browser's confirm() box.
  test('UI-09 cancelling the modal and the delete confirmation keeps data; accepting deletes it @dialog @state', async ({
    registrationPage: ui,
    registrationApi,
    page,
  }) => {
    // Cancel in the confirmation popup: nothing is sent to the server.
    await test.step('Cancel in the confirmation modal sends nothing and keeps the form', async () => {
      const data = buildRegistration();
      await ui.fill(data);
      await ui.submit();
      await expect(ui.dialog.root).toBeVisible();
      await ui.dialog.cancel();
      await expect(ui.dialog.root).toBeHidden();
      await expect(ui.email, 'entered data is kept').toHaveValue(data.email);
      const { body } = await registrationApi.list({ email: data.email });
      expect(body.total).toBe(0);
    });

    // Precondition: a registration owned by this test.
    const existing = buildRegistration();
    const { body: created } = await registrationApi.create(existing);
    await page.reload();
    const row = ui.table.rowByEmail(existing.email);
    await expect(row).toBeVisible();

    // Click Delete, then answer 'Cancel' in the browser box: the row must stay.
    await test.step('dismissing the browser confirm() keeps the registration', async () => {
      // page.once('dialog') answers the browser's confirm() box for us, and checks its message.
      page.once('dialog', async (dialog) => {
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toBe(`Delete registration ${created.reference}? This cannot be undone.`);
        await dialog.dismiss();
      });
      await ui.table.deleteButton(row).click();
      await expect(row).toBeVisible();
      expect((await registrationApi.get(created.id)).status).toBe(200);
    });

    // Click Delete, then answer 'OK': the row disappears and the API returns 404.
    await test.step('accepting the browser confirm() deletes it everywhere', async () => {
      page.once('dialog', (dialog) => dialog.accept());
      await ui.table.deleteButton(row).click();
      await expect(ui.notification(`Registration ${created.reference} deleted`)).toBeVisible();
      await expect(row).toHaveCount(0);
      expect((await registrationApi.get(created.id)).status).toBe(404);
    });
  });
});
