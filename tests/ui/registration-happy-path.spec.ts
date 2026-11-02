import { test, expect } from '../../fixtures/test-fixtures';
import { buildRegistration } from '../../test-data/registration.factory';
import { files, imageSizes } from '../../test-data/files';
import { displayDate } from '../../utils/dates';

test.describe('Registration - happy path', () => {
  // UI-01 (Amine): the full happy path - fill the form, confirm, and check the registration is shown and saved.
  test('UI-01 registers with valid data and the registration is displayed and persisted @positive @state @regression', async ({
    registrationPage: ui,
    registrationApi,
    page,
  }) => {
    // Unique test data (unique email), so this test never clashes with tests running in parallel.
    const data = buildRegistration({ ticketType: 'vip', tickets: 2 });
    // Remember the email so the fixture deletes this registration after the test.
    registrationApi.trackEmail(data.email);

    // Step 1: fill every field, upload a PDF and a photo, and check the app accepted them.
    await test.step('fill every control with valid data', async () => {
      await ui.fill(data);
      await ui.uploadDocument(files.pdf);
      await ui.uploadPhoto(files.png);
      // Uploads are processed client-side: the status text proves the file was accepted.
      await expect(ui.documentStatus).toHaveText(/^Uploaded: id-document\.pdf \(\d+\.\d KB\)$/);
      await expect(ui.photoPreview).toBeVisible();
      await expect(ui.photoStatus).toHaveText(`profile-photo.png · ${imageSizes.png.width}×${imageSizes.png.height} px`);
      await expect(ui.ticketType).toHaveValue('vip');
      await expect(ui.totalPrice).toHaveText('Total: €298.00');
    });

    // Step 2: click Register and check the popup shows exactly what we entered.
    await test.step('confirmation dialog summarises the registration', async () => {
      await ui.submit();
      await expect(ui.dialog.root).toBeVisible();
      await expect(ui.dialog.value('Name')).toHaveText(data.fullName);
      await expect(ui.dialog.value('Email')).toHaveText(data.email);
      await expect(ui.dialog.value('Ticket')).toHaveText('VIP × 2');
      await expect(ui.dialog.value('Date')).toHaveText(displayDate(data.eventDate));
      await expect(ui.dialog.value('Total')).toHaveText('€298.00');
    });

    let reference = '';
    // Step 3: confirm, wait for the API answer, then check the spinner and the success message.
    await test.step('confirming shows progress, then a success notification', async () => {
      const statusPromise = ui.confirmAndWaitForApi();
      await expect(ui.spinner).toBeVisible();
      expect(await statusPromise).toBe(201);
      await expect(ui.spinner).toBeHidden();
      const toast = ui.notification(/^Registration confirmed: EVH-[0-9A-F]{6}$/);
      await expect(toast).toBeVisible();
      reference = (await toast.textContent())!.replace('Registration confirmed: ', '');
      await expect(ui.fullName, 'form is reset after a successful registration').toHaveValue('');
      await expect(toast, 'notification disappears on its own').toBeHidden({ timeout: 6_000 });
    });

    // Step 4: find OUR row by its unique email and check every column.
    await test.step('the new registration is listed with the submitted values', async () => {
      const row = ui.table.rowByEmail(data.email);
      await expect(row).toHaveCount(1);
      await expect(ui.table.cell(row, 'Reference')).toHaveText(reference);
      await expect(ui.table.cell(row, 'Name')).toHaveText(data.fullName);
      await expect(ui.table.cell(row, 'Ticket')).toHaveText('VIP');
      await expect(ui.table.cell(row, 'Qty')).toHaveText('2');
      await expect(ui.table.cell(row, 'Event date')).toHaveText(displayDate(data.eventDate));
      await expect(ui.table.cell(row, 'Total')).toHaveText('€298.00');
    });

    // Step 5: reload the page - the row must still be there (the data is saved on the server).
    await test.step('the registration survives a page reload (persisted on the server)', async () => {
      await page.reload();
      await expect(ui.table.rowByEmail(data.email)).toHaveCount(1);
    });

    // Step 6: ask the API directly, to prove the saved data matches the form.
    await test.step('API state matches what the user entered, including uploads and multi-line notes', async () => {
      const { body } = await registrationApi.list({ email: data.email });
      expect(body.total).toBe(1);
      expect(body.items[0]).toMatchObject({
        reference,
        fullName: data.fullName,
        notes: data.notes,
        totalPrice: 298,
        document: { name: 'id-document.pdf', type: 'application/pdf' },
        photo: { name: 'profile-photo.png', ...imageSizes.png },
      });
    });
  });
});
