import { test, expect } from '../../fixtures/test-fixtures';
import { env } from '../../config/env';

test.describe('Authentication (regression)', () => {
  // UI-10 (Amine): login protects the registration page.
  test('UI-10 sign-in guards the registration page and lands users on it after login @regression @smoke @negative', async ({
    loginPage,
    page,
  }) => {
    // Not logged in: opening the registration page sends you back to sign-in.
    await test.step('visiting the registration page without a session redirects to sign-in', async () => {
      await page.goto('/register.html');
      await expect(page).toHaveURL('/');
      await expect(page).toHaveTitle('Sign in | EventHub');
      await expect(loginPage.heading('Sign in to EventHub')).toBeVisible();
    });

    // Clicking Sign in with empty fields shows an error.
    await test.step('empty credentials are refused', async () => {
      await loginPage.signInButton.click();
      await expect(loginPage.errorAlert).toHaveText('Enter your username and password');
    });

    // A wrong password is refused and you stay on the sign-in page.
    await test.step('a wrong password is refused and the user stays on the sign-in page', async () => {
      await loginPage.signIn(env.credentials.username, 'wrong-password');
      await expect(loginPage.errorAlert).toHaveText('Invalid username or password');
      await expect(page).toHaveURL('/');
    });

    // The correct username and password (from .env) open the registration page.
    await test.step('valid credentials open the registration page', async () => {
      await loginPage.signIn(env.credentials.username, env.credentials.password);
      await expect(page).toHaveURL('/register.html');
      await expect(page).toHaveTitle('Event registration | EventHub');
      await expect(page.getByRole('heading', { level: 1, name: 'Event registration' })).toBeVisible();
    });

    // Sign out, then check the registration page is protected again.
    await test.step('signing out ends the session', async () => {
      await page.getByRole('button', { name: 'Sign out' }).click();
      await expect(page).toHaveURL('/');
      await page.goto('/register.html');
      await expect(page).toHaveURL('/');
    });
  });
});
