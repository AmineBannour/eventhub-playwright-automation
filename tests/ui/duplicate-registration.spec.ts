import { test, expect } from '../../fixtures/test-fixtures';
import { buildRegistration } from '../../test-data/registration.factory';

test.describe('Failure-oriented', () => {
  // UI-F01 (Issraa): failure-oriented test - registering the same email twice must be refused.
  test('UI-F01 a second registration with an already-used email is rejected with a clear error @negative @failure', async ({
    registrationPage: ui,
    registrationApi,
  }) => {
    // Precondition: the email is already registered (created through the API).
    const original = buildRegistration();
    await registrationApi.create(original);

    // Same email in upper case: the app must treat emails case-insensitively.
    const duplicate = buildRegistration({ fullName: 'Someone Else', email: original.email.toUpperCase() });
    await ui.fill(duplicate);
    await ui.submit();
    // Confirm and capture the API's answer: it must be 409 (Conflict).
    const status = await ui.confirmAndWaitForApi();

    expect(status, 'API rejects the duplicate with 409 Conflict').toBe(409);
    await expect(ui.formAlert).toHaveText('A registration with this email already exists');
    await expect(ui.fieldError('email')).toHaveText('This email is already registered');
    await expect(ui.email).toHaveAttribute('aria-invalid', 'true');
    await expect(ui.notification(/Registration confirmed/)).toHaveCount(0);
    await expect(ui.fullName, 'the form keeps the input so the user can correct it').toHaveValue('Someone Else');

    // The API must still hold only the original registration.
    const { body } = await registrationApi.list({ email: original.email });
    expect(body.total, 'still exactly one registration for this email').toBe(1);
    expect(body.items[0].fullName).toBe(original.fullName);
  });
});
