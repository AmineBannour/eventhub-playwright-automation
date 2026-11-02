import { randomUUID } from 'node:crypto';
import { bookableDate } from '../utils/dates';
import type { RegistrationInput } from '../utils/types';

/**
 * Builds valid registration data. Every call produces a unique email, which
 * is what keeps tests isolated when they run in parallel against the same
 * server (the app rejects duplicate emails).
 */
export function uniqueEmail(prefix = 'qa'): string {
  return `${prefix}.${randomUUID().slice(0, 8)}@eventhub.test`;
}

export function buildRegistration(overrides: Partial<RegistrationInput> = {}): RegistrationInput {
  return {
    fullName: 'Ada Lovelace',
    email: uniqueEmail(),
    age: 36,
    tickets: 2,
    ticketType: 'vip',
    eventDate: bookableDate(30),
    notes: 'Vegetarian meal\nWheelchair access needed',
    document: null,
    photo: null,
    ...overrides,
  };
}

export const ticketPrices = { standard: 49, vip: 149, student: 19 } as const;
