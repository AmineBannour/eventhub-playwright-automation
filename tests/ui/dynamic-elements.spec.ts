import { randomUUID } from 'node:crypto';
import { test, expect } from '../../fixtures/test-fixtures';
import { buildRegistration } from '../../test-data/registration.factory';

test.describe('Registration page - dynamic elements', () => {
  // UI-08 (Amira): parts of the page that update by themselves while the user types.
  test('UI-08 total price, character counter and list filter update as the user interacts @dynamic', async ({
    registrationPage: ui,
    registrationApi,
    page,
  }) => {
    // The total price is recalculated every time the ticket type or quantity changes.
    await test.step('total price is recalculated on every change', async () => {
      await expect(ui.totalPrice).toHaveText('Total: €0.00');
      // Each row: ticket type to pick, quantity to type, expected total.
      const steps: [string | null, string | null, string][] = [
        ['standard', null, 'Total: €49.00'],
        [null, '3', 'Total: €147.00'],
        ['vip', null, 'Total: €447.00'],
        ['student', '10', 'Total: €190.00'],
      ];
      for (const [type, qty, expected] of steps) {
        if (type) await ui.ticketType.selectOption(type);
        if (qty) await ui.tickets.fill(qty);
        await expect(ui.totalPrice).toHaveText(expected);
      }
    });

    // The notes counter updates live and turns red above 500 characters.
    await test.step('notes counter counts characters and flags the 500 limit', async () => {
      await ui.notes.fill('Line one\nLine two');
      await expect(ui.notesCounter).toHaveText('17 / 500');
      await ui.notes.fill('a'.repeat(500));
      await expect(ui.notesCounter).toHaveText('500 / 500');
      await expect(ui.notesCounter).not.toHaveClass(/over/);
      await expect(ui.fieldError('notes')).toBeHidden();
      await ui.notes.fill('a'.repeat(501));
      await expect(ui.notesCounter).toHaveText('501 / 500');
      await expect(ui.notesCounter).toHaveClass(/over/);
      await expect(ui.fieldError('notes')).toHaveText('Notes must be 500 characters or fewer');
    });

    // Typing in the filter box shows and hides rows instantly.
    await test.step('the list filter shows and hides rows as you type', async () => {
      // Precondition data is created through the API with a tag unique to this test.
      const tag = `filter${randomUUID().slice(0, 6)}`;
      const first = buildRegistration({ email: `${tag}.one@eventhub.test` });
      const second = buildRegistration({ email: `${tag}.two@eventhub.test` });
      await registrationApi.create(first);
      await registrationApi.create(second);
      await page.reload();

      await ui.table.filterBy(tag);
      await expect(ui.table.dataRows()).toHaveCount(2);
      await ui.table.filterBy(first.email);
      await expect(ui.table.dataRows()).toHaveCount(1);
      await expect(ui.table.rowByEmail(first.email)).toBeVisible();
      await ui.table.filterBy(`${tag}.nobody`);
      await expect(ui.table.dataRows()).toHaveCount(0);
      await expect(ui.table.emptyState).toHaveText('No registrations match the filter.');
    });
  });
});
