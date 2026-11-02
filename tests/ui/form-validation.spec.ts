import { test, expect } from '../../fixtures/test-fixtures';
import invalidFields from '../../test-data/invalid-fields.json';
import { numericBoundaries, rangeMessage } from '../../test-data/boundaries';
import type { FormField } from '../../pages/RegistrationPage';

test.describe('Registration form - field validation', () => {
  // UI-02 (Salma): submit an empty form and check every required-field error appears.
  test('UI-02 submitting an empty form shows every required-field message and opens no dialog @negative @validation', async ({
    registrationPage: ui,
  }) => {
    await ui.submit();

    await expect(ui.formAlert).toHaveText('Please fix 5 errors before submitting');
    const expected: [FormField, string][] = [
      ['fullName', 'Full name is required'],
      ['email', 'Email is required'],
      ['age', 'Age is required'],
      ['ticketType', 'Select a ticket type'],
      ['eventDate', 'Event date is required'],
    ];
    for (const [field, message] of expected) {
      await expect(ui.fieldError(field), `${field} message`).toHaveText(message);
    }
    await expect(ui.fullName).toHaveAttribute('aria-invalid', 'true');
    await expect(ui.fullName, 'focus moves to the first invalid field').toBeFocused();
    await expect(ui.fieldError('tickets'), 'tickets defaults to 1, which is valid').toBeHidden();
    await expect(ui.dialog.root).toBeHidden();

    // Correcting a field clears its message immediately (live re-validation).
    // Fix one field: its error must disappear straight away (live validation).
    await ui.fullName.fill('Grace Hopper');
    await expect(ui.fieldError('fullName')).toBeHidden();
    await expect(ui.fullName).not.toHaveAttribute('aria-invalid', 'true');
  });

  // Data-driven: the same test logic runs once per row of test-data/invalid-fields.json.
  // UI-03 (Salma): one test per row of invalid-fields.json; each row gives a value and the error we expect.
  for (const row of invalidFields) {
    test(`UI-03 [${row.id}] rejects ${row.field}="${row.value}" with the right message @data-driven @validation @negative`, async ({
      registrationPage: ui,
    }) => {
      // Type the invalid value and leave the field, which triggers validation.
      await ui.enterAndBlur(row.field as 'fullName' | 'email' | 'age' | 'tickets', row.value);

      await expect(ui.fieldError(row.field as FormField)).toHaveText(row.expectedError);
      await expect(ui[row.field as 'fullName']).toHaveAttribute('aria-invalid', 'true');
    });
  }

  // Boundary value analysis: below / on / above each numeric limit.
  // UI-04 (Salma): test just below, on and just above each limit (e.g. age 17/18 and 99/100).
  for (const { field, value, valid } of numericBoundaries) {
    test(`UI-04 [${field}=${value}] is ${valid ? 'accepted' : 'rejected'} at the boundary @boundary @data-driven`, async ({
      registrationPage: ui,
    }) => {
      await ui.enterAndBlur(field, String(value));

      // Valid values must show no error; invalid values must show the range message.
      if (valid) {
        await expect(ui.fieldError(field)).toBeHidden();
        await expect(ui[field]).not.toHaveAttribute('aria-invalid', 'true');
      } else {
        await expect(ui.fieldError(field)).toHaveText(rangeMessage(field));
        await expect(ui[field]).toHaveAttribute('aria-invalid', 'true');
      }
      // The number input exposes the same limits to the browser.
      await expect(ui[field]).toHaveAttribute('min', field === 'age' ? '18' : '1');
      await expect(ui[field]).toHaveAttribute('max', field === 'age' ? '99' : '10');
    });
  }
});
