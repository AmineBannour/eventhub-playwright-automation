import { test, expect } from '../../fixtures/test-fixtures';
import { buildRegistration } from '../../test-data/registration.factory';
import { bookableDate, displayDate, isoDaysFromToday, nextSunday } from '../../utils/dates';

test.describe('Registration form - date picker', () => {
  // UI-07 (Issraa): the event date must be between tomorrow and one year ahead, and not a Sunday.
  test('UI-07 event date only allows Monday-Saturday dates from tomorrow to one year ahead @date @validation @boundary', async ({
    registrationPage: ui,
    registrationApi,
  }) => {
    // The date input itself carries the min/max limits set by the app.
    await test.step('the picker exposes the allowed range to the browser', async () => {
      await expect(ui.eventDate).toHaveAttribute('min', isoDaysFromToday(1));
      await expect(ui.eventDate).toHaveAttribute('max', isoDaysFromToday(365));
    });

    // Each row: description, date, expected error. Dates are computed from today, so the test never goes out of date.
    const rejected: [string, string, string][] = [
      ['yesterday', isoDaysFromToday(-1), 'Event date must be in the future'],
      ['today (boundary)', isoDaysFromToday(0), 'Event date must be in the future'],
      ['366 days ahead (boundary)', isoDaysFromToday(366), 'Event date must be within the next 365 days'],
      ['a Sunday', nextSunday(), 'The venue is closed on Sundays'],
    ];
    for (const [label, value, message] of rejected) {
      await test.step(`${label} (${value}) is rejected`, async () => {
        await ui.enterAndBlur('eventDate', value);
        await expect(ui.fieldError('eventDate')).toHaveText(message);
      });
    }

    const tomorrow = bookableDate(1);
    // The first allowed day must be accepted.
    await test.step(`the earliest bookable day (${tomorrow}) is accepted`, async () => {
      await ui.enterAndBlur('eventDate', tomorrow);
      await expect(ui.fieldError('eventDate')).toBeHidden();
      await expect(ui.eventDate).toHaveValue(tomorrow);
    });

    // The confirmation popup shows the date in a readable format; we cancel so nothing is saved.
    await test.step('the chosen date is shown in a readable format before confirming', async () => {
      const data = buildRegistration({ eventDate: tomorrow });
      await ui.fill({ ...data, eventDate: undefined });
      await ui.submit();
      await expect(ui.dialog.value('Date')).toHaveText(displayDate(tomorrow));
      await ui.dialog.cancel();
      const { body } = await registrationApi.list({ email: data.email });
      expect(body.total, 'cancelling must not create a registration').toBe(0);
    });
  });
});
