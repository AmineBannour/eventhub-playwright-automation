import type { Locator, Page } from '@playwright/test';

export const COLUMNS = ['Reference', 'Name', 'Email', 'Ticket', 'Qty', 'Event date', 'Total'] as const;

/**
 * "My registrations" table. Rows are always located by the unique email of
 * the test's own data - never by position - because other tests running in
 * parallel add rows to the same table.
 */
export class RegistrationsTable {
  readonly root: Locator;
  readonly filter: Locator;
  readonly emptyState: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByRole('table', { name: 'My registrations' });
    this.filter = page.getByRole('textbox', { name: 'Filter by email' });
    this.emptyState = page.locator('#empty-state');
  }

  dataRows(): Locator {
    return this.root.locator('tbody').getByRole('row');
  }

  rowByEmail(email: string): Locator {
    return this.dataRows().filter({ has: this.page.getByRole('cell', { name: email, exact: true }) });
  }

  cell(row: Locator, column: (typeof COLUMNS)[number]): Locator {
    return row.getByRole('cell').nth(COLUMNS.indexOf(column));
  }

  deleteButton(row: Locator): Locator {
    return row.getByRole('button', { name: /^Delete registration EVH-/ });
  }

  async filterBy(text: string): Promise<void> {
    await this.filter.fill(text);
  }
}
