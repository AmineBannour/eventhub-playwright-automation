import { BaseApiClient, type SendOptions } from './BaseApiClient';
import type { Registration, RegistrationInput } from '../utils/types';

const BASE = '/api/registrations';

/** CRUD client for /api/registrations. Remembers what it created so fixtures can clean up. */
export class RegistrationClient extends BaseApiClient {
  readonly createdIds = new Set<string>();
  /** Emails of registrations created through the UI, so teardown can find them. */
  readonly trackedEmails = new Set<string>();

  trackEmail(email: string): void {
    this.trackedEmails.add(email.toLowerCase());
  }

  async create(input: RegistrationInput | Record<string, unknown>, options: SendOptions = {}) {
    const result = await this.send<Registration>('POST', BASE, { ...options, data: input });
    if (result.status === 201) this.createdIds.add(result.body.id);
    return result;
  }

  createRaw(rawBody: string) {
    return this.send<{ error: string }>('POST', BASE, { rawBody });
  }

  get(id: string, options: SendOptions = {}) {
    return this.send<Registration>('GET', `${BASE}/${id}`, options);
  }

  getByUrl(location: string) {
    return this.send<Registration>('GET', location);
  }

  list(params: { email?: string } = {}, options: SendOptions = {}) {
    return this.send<{ items: Registration[]; total: number }>('GET', BASE, { ...options, params: params as Record<string, string> });
  }

  update(id: string, input: RegistrationInput) {
    return this.send<Registration>('PUT', `${BASE}/${id}`, { data: input });
  }

  async remove(id: string) {
    const result = await this.send<string>('DELETE', `${BASE}/${id}`);
    if (result.status === 204) this.createdIds.delete(id);
    return result;
  }

  /** Teardown helper: deletes every registration created through this client. */
  async cleanup(): Promise<void> {
    for (const email of this.trackedEmails) {
      const { body } = await this.list({ email });
      body.items.filter((r) => r.email === email).forEach((r) => this.createdIds.add(r.id));
    }
    for (const id of [...this.createdIds]) await this.remove(id);
  }
}
