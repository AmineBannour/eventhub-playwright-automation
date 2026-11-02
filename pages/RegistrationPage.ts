import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { RegistrationsTable } from '../components/RegistrationsTable';
import type { RegistrationInput } from '../utils/types';

export type FormField = 'fullName' | 'email' | 'age' | 'tickets' | 'ticketType' | 'eventDate' | 'notes' | 'document' | 'photo';

/** A file path on disk or an in-memory payload (used for oversized files). */
export type Upload = string | { name: string; mimeType: string; buffer: Buffer };

/**
 * Page object for /register.html. Tests describe *what* they do
 * (fill the form, submit, confirm); the selectors live only here.
 */
export class RegistrationPage extends BasePage {
  protected readonly path = '/register.html';

  readonly fullName: Locator;
  readonly email: Locator;
  readonly age: Locator;
  readonly tickets: Locator;
  readonly ticketType: Locator;
  readonly eventDate: Locator;
  readonly notes: Locator;
  readonly notesCounter: Locator;
  readonly documentInput: Locator;
  readonly documentStatus: Locator;
  readonly photoInput: Locator;
  readonly photoPreview: Locator;
  readonly photoStatus: Locator;
  readonly totalPrice: Locator;
  readonly submitButton: Locator;
  readonly spinner: Locator;
  readonly formAlert: Locator;
  readonly dialog: ConfirmDialog;
  readonly table: RegistrationsTable;

  constructor(page: Page) {
    super(page);
    this.fullName = page.getByLabel('Full name');
    this.email = page.getByLabel('Email', { exact: true });
    this.age = page.getByLabel('Age');
    this.tickets = page.getByLabel('Number of tickets');
    this.ticketType = page.getByLabel('Ticket type');
    this.eventDate = page.getByLabel('Event date');
    this.notes = page.getByLabel('Notes');
    this.notesCounter = page.locator('#notes-counter');
    this.documentInput = page.getByLabel('ID document (PDF)');
    this.documentStatus = page.locator('#document-status');
    this.photoInput = page.getByLabel('Profile photo (PNG or JPEG)');
    this.photoPreview = page.getByRole('img', { name: 'Profile photo preview' });
    this.photoStatus = page.locator('#photo-status');
    this.totalPrice = page.locator('#total-price');
    this.submitButton = page.getByRole('button', { name: 'Register' });
    this.spinner = page.getByRole('status').filter({ hasText: 'Submitting registration' });
    this.formAlert = page.locator('#form-alert');
    this.dialog = new ConfirmDialog(page);
    this.table = new RegistrationsTable(page);
  }

  /** Opens the page and waits until the registrations list has been loaded from the API. */
  async open(): Promise<void> {
    const listLoaded = this.page.waitForResponse(
      (res) => res.request().method() === 'GET' && new URL(res.url()).pathname === '/api/registrations',
    );
    await this.goto();
    await listLoaded;
  }

  /** Field-level validation message (each input references it via aria-describedby). */
  fieldError(field: FormField): Locator {
    return this.page.locator(`#${field}-error`);
  }

  /** Fills only the fields that are provided, so tests can build partial/invalid forms. */
  async fill(data: Partial<RegistrationInput>): Promise<void> {
    if (data.fullName !== undefined) await this.fullName.fill(data.fullName);
    if (data.email !== undefined) await this.email.fill(data.email);
    if (data.age !== undefined) await this.age.fill(String(data.age));
    if (data.tickets !== undefined) await this.tickets.fill(String(data.tickets));
    if (data.ticketType !== undefined) await this.ticketType.selectOption(String(data.ticketType));
    if (data.eventDate !== undefined) await this.eventDate.fill(data.eventDate);
    if (data.notes !== undefined) await this.notes.fill(data.notes);
  }

  /** Types a value into one field and leaves it, which triggers its live validation. */
  async enterAndBlur(field: Exclude<FormField, 'document' | 'photo' | 'ticketType'>, value: string): Promise<void> {
    const input = this[field];
    await input.fill(value);
    await input.blur();
  }

  async uploadDocument(file: Upload): Promise<void> {
    await this.documentInput.setInputFiles(file);
  }

  async uploadPhoto(file: Upload): Promise<void> {
    await this.photoInput.setInputFiles(file);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /** Full happy path: fill, submit, confirm in the modal and wait for the API response. */
  async register(data: Partial<RegistrationInput>): Promise<void> {
    await this.fill(data);
    await this.submit();
    await this.confirmAndWaitForApi();
  }

  async confirmAndWaitForApi(): Promise<number> {
    const created = this.page.waitForResponse(
      (res) => res.request().method() === 'POST' && new URL(res.url()).pathname === '/api/registrations',
    );
    await this.dialog.confirm();
    return (await created).status();
  }
}
