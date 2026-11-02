import type { Locator, Page } from '@playwright/test';

/** The modal <dialog> shown before a registration is sent. */
export class ConfirmDialog {
  readonly root: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('dialog', { name: 'Confirm registration' });
    this.confirmButton = this.root.getByRole('button', { name: 'Confirm' });
    this.cancelButton = this.root.getByRole('button', { name: 'Cancel' });
  }

  /** Value next to a <dt> label in the summary, e.g. value('Total'). */
  value(term: string): Locator {
    return this.root.locator('dt', { hasText: term }).locator('xpath=following-sibling::dd[1]');
  }

  async confirm(): Promise<void> {
    await this.confirmButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }
}
