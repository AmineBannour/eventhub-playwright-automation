/**
 * Boundary value analysis for the numeric fields: for each limit we test the
 * value just below, on, and just above it. `valid: false` rows must show the
 * documented range message.
 */
export interface BoundaryCase {
  field: 'age' | 'tickets';
  value: number;
  valid: boolean;
}

export const AGE_RANGE_MESSAGE = 'Age must be between 18 and 99';
export const TICKETS_RANGE_MESSAGE = 'Number of tickets must be between 1 and 10';

export const numericBoundaries: BoundaryCase[] = [
  { field: 'age', value: 17, valid: false },
  { field: 'age', value: 18, valid: true },
  { field: 'age', value: 99, valid: true },
  { field: 'age', value: 100, valid: false },
  { field: 'tickets', value: 0, valid: false },
  { field: 'tickets', value: 1, valid: true },
  { field: 'tickets', value: 10, valid: true },
  { field: 'tickets', value: 11, valid: false },
];

export const rangeMessage = (field: BoundaryCase['field']) =>
  field === 'age' ? AGE_RANGE_MESSAGE : TICKETS_RANGE_MESSAGE;
