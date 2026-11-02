import { test as base, expect } from '@playwright/test';
import { env } from '../config/env';
import { AuthClient } from '../clients/AuthClient';
import { PublicClient } from '../clients/PublicClient';
import { RegistrationClient } from '../clients/RegistrationClient';
import { LoginPage } from '../pages/LoginPage';
import { RegistrationPage } from '../pages/RegistrationPage';

const TOKEN_KEY = 'eventhub.token';

interface Fixtures {
  /** Records worker index + timing so parallel execution can be proven from the report. */
  executionTrace: void;
  authClient: AuthClient;
  publicClient: PublicClient;
  apiToken: string;
  /** Authenticated registrations API client; deletes everything the test created afterwards. */
  registrationApi: RegistrationClient;
  loginPage: LoginPage;
  /** Registration page opened with a fresh session (token injected, no UI login needed). */
  registrationPage: RegistrationPage;
}

/**
 * Custom fixtures: each test gets its own token, clients, pages and
 * clean-up. Nothing is shared between tests, which is what makes the
 * suite safe to run in any order and in parallel.
 */
export const test = base.extend<Fixtures>({
  executionTrace: [
    async ({}, use, testInfo) => {
      const startedAt = new Date().toISOString();
      await use();
      testInfo.annotations.push({
        type: 'execution',
        description: `worker=${testInfo.workerIndex} parallelIndex=${testInfo.parallelIndex} start=${startedAt} end=${new Date().toISOString()}`,
      });
    },
    { auto: true },
  ],

  authClient: async ({ request }, use, testInfo) => {
    await use(new AuthClient(request, null, testInfo));
  },

  publicClient: async ({ request }, use, testInfo) => {
    await use(new PublicClient(request, null, testInfo));
  },

  apiToken: async ({ request }, use) => {
    // Setup calls are not attached as evidence to keep reports focused.
    const token = await new AuthClient(request).getToken(env.credentials.username, env.credentials.password);
    await use(token);
  },

  registrationApi: async ({ request, apiToken }, use, testInfo) => {
    const client = new RegistrationClient(request, apiToken, testInfo);
    await use(client);
    await client.cleanup();
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  registrationPage: async ({ page, apiToken }, use) => {
    await page.addInitScript(
      ([key, token]) => {
        if (!window.sessionStorage.getItem(key)) window.sessionStorage.setItem(key, token);
      },
      [TOKEN_KEY, apiToken] as const,
    );
    const registrationPage = new RegistrationPage(page);
    await registrationPage.open();
    await expect(registrationPage.heading('Event registration')).toBeVisible();
    await use(registrationPage);
  },
});

export { expect };
