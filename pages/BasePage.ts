import type { Locator, Page } from '@playwright/test';

/** Behaviour shared by every page object. */
export abstract class BasePage {
  protected abstract readonly path: string;

  constructor(protected readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto(this.path);
  }

  heading(name: string | RegExp): Locator {
    return this.page.getByRole('heading', { level: 1, name });
  }

  /** Toast / live-region notifications (role="status"). */
  notification(text: string | RegExp): Locator {
    return this.page.getByRole('status').filter({ hasText: text });
  }
}
