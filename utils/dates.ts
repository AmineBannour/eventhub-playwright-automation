/**
 * Date helpers that mirror the business rules of the app: bookings are
 * allowed from tomorrow up to 365 days ahead, and never on a Sunday.
 * All dates are computed relative to "today" at run time, so tests never
 * go stale.
 */
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function addDays(days: number, from = new Date()): Date {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  date.setDate(date.getDate() + days);
  return date;
}

export function toIso(date: Date): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

export function isoDaysFromToday(days: number): string {
  return toIso(addDays(days));
}

/** A valid, bookable date roughly `daysAhead` days from now (skips Sundays). */
export function bookableDate(daysAhead = 30): string {
  let date = addDays(daysAhead);
  if (date.getDay() === 0) date = addDays(daysAhead + 1);
  return toIso(date);
}

/** The first Sunday at least `minDaysAhead` days from now. */
export function nextSunday(minDaysAhead = 7): string {
  let date = addDays(minDaysAhead);
  while (date.getDay() !== 0) date = addDays(1, date);
  return toIso(date);
}

/** Same display format as the application, e.g. "Mon 15 Mar 2027". */
export function displayDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${DAYS[date.getDay()]} ${String(d).padStart(2, '0')} ${MONTHS[m - 1]} ${y}`;
}
