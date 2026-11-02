import { isoDaysFromToday, nextSunday } from '../utils/dates';
import type { RegistrationInput } from '../utils/types';

/** Negative API data sets: one invalid property each, with the error the API must return. */
export interface InvalidPayloadCase {
  name: string;
  override: Partial<RegistrationInput>;
  field: string;
  message: string;
}

export const invalidPayloads: InvalidPayloadCase[] = [
  { name: 'malformed email', override: { email: 'not-an-email' }, field: 'email', message: 'Enter a valid email address' },
  { name: 'date in the past', override: { eventDate: isoDaysFromToday(-1) }, field: 'eventDate', message: 'Event date must be in the future' },
  { name: 'date is today', override: { eventDate: isoDaysFromToday(0) }, field: 'eventDate', message: 'Event date must be in the future' },
  { name: 'date on a Sunday', override: { eventDate: nextSunday() }, field: 'eventDate', message: 'The venue is closed on Sundays' },
  { name: 'wrong date format', override: { eventDate: '15/03/2027' }, field: 'eventDate', message: 'Event date must use the format YYYY-MM-DD' },
  { name: 'unknown ticket type', override: { ticketType: 'platinum' }, field: 'ticketType', message: 'Unknown ticket type' },
  { name: 'notes over 500 characters', override: { notes: 'x'.repeat(501) }, field: 'notes', message: 'Notes must be 500 characters or fewer' },
  {
    name: 'document is not a PDF',
    override: { document: { name: 'cv.docx', size: 2048, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' } },
    field: 'document',
    message: 'Only PDF documents are accepted',
  },
];
