/*
 * EventHub business rules, shared by the browser (form validation) and the
 * server (API validation) so both enforce exactly the same requirements.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.EventHubRules = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const TICKET_TYPES = [
    { code: 'standard', label: 'Standard', price: 49, currency: 'EUR' },
    { code: 'vip', label: 'VIP', price: 149, currency: 'EUR' },
    { code: 'student', label: 'Student', price: 19, currency: 'EUR' },
  ];

  const LIMITS = {
    nameMin: 2,
    nameMax: 50,
    ageMin: 18,
    ageMax: 99,
    ticketsMin: 1,
    ticketsMax: 10,
    notesMax: 500,
    maxDaysAhead: 365,
    documentMaxBytes: 1024 * 1024,
    photoMaxBytes: 2 * 1024 * 1024,
  };

  const DOCUMENT_TYPES = ['application/pdf'];
  const PHOTO_TYPES = ['image/png', 'image/jpeg'];

  const NAME_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

  function toIsoDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function addDays(date, days) {
    const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  /** Earliest and latest bookable dates, relative to "today" (local time). */
  function dateWindow(today = new Date()) {
    return { min: toIsoDate(addDays(today, 1)), max: toIsoDate(addDays(today, LIMITS.maxDaysAhead)) };
  }

  function parseIsoDate(value) {
    if (!DATE_PATTERN.test(value)) return null;
    const [y, m, d] = value.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
    return date;
  }

  function isBlank(value) {
    return value === undefined || value === null || String(value).trim() === '';
  }

  function validateInteger(value, { min, max, requiredMsg, wholeMsg, rangeMsg }) {
    if (isBlank(value)) return requiredMsg;
    const num = Number(value);
    if (!Number.isFinite(num) || !Number.isInteger(num)) return wholeMsg;
    if (num < min || num > max) return rangeMsg;
    return null;
  }

  const fieldValidators = {
    fullName(value) {
      if (isBlank(value)) return 'Full name is required';
      const name = String(value).trim();
      if (name.length < LIMITS.nameMin || name.length > LIMITS.nameMax) {
        return `Full name must be between ${LIMITS.nameMin} and ${LIMITS.nameMax} characters`;
      }
      if (!NAME_PATTERN.test(name)) return 'Full name may only contain letters, spaces, hyphens and apostrophes';
      return null;
    },
    email(value) {
      if (isBlank(value)) return 'Email is required';
      if (!EMAIL_PATTERN.test(String(value).trim())) return 'Enter a valid email address';
      return null;
    },
    age(value) {
      return validateInteger(value, {
        min: LIMITS.ageMin,
        max: LIMITS.ageMax,
        requiredMsg: 'Age is required',
        wholeMsg: 'Age must be a whole number',
        rangeMsg: `Age must be between ${LIMITS.ageMin} and ${LIMITS.ageMax}`,
      });
    },
    tickets(value) {
      return validateInteger(value, {
        min: LIMITS.ticketsMin,
        max: LIMITS.ticketsMax,
        requiredMsg: 'Number of tickets is required',
        wholeMsg: 'Number of tickets must be a whole number',
        rangeMsg: `Number of tickets must be between ${LIMITS.ticketsMin} and ${LIMITS.ticketsMax}`,
      });
    },
    ticketType(value) {
      if (isBlank(value)) return 'Select a ticket type';
      if (!TICKET_TYPES.some((t) => t.code === value)) return 'Unknown ticket type';
      return null;
    },
    eventDate(value, today = new Date()) {
      if (isBlank(value)) return 'Event date is required';
      const date = parseIsoDate(String(value));
      if (!date) return 'Event date must use the format YYYY-MM-DD';
      const { min, max } = dateWindow(today);
      const iso = toIsoDate(date);
      if (iso < min) return 'Event date must be in the future';
      if (iso > max) return `Event date must be within the next ${LIMITS.maxDaysAhead} days`;
      if (date.getDay() === 0) return 'The venue is closed on Sundays';
      return null;
    },
    notes(value) {
      if (isBlank(value)) return null;
      if (String(value).length > LIMITS.notesMax) return `Notes must be ${LIMITS.notesMax} characters or fewer`;
      return null;
    },
  };

  /** Validates uploaded file metadata ({ name, size, type }). */
  function validateDocument(file) {
    if (!file) return null;
    const isPdf = DOCUMENT_TYPES.includes(file.type) || /\.pdf$/i.test(file.name || '');
    if (!isPdf) return 'Only PDF documents are accepted';
    if (file.size > LIMITS.documentMaxBytes) return 'Document must be 1 MB or smaller';
    if (file.size === 0) return 'Document is empty';
    return null;
  }

  function validatePhoto(file) {
    if (!file) return null;
    if (!PHOTO_TYPES.includes(file.type)) return 'Only PNG or JPEG images are accepted';
    if (file.size > LIMITS.photoMaxBytes) return 'Image must be 2 MB or smaller';
    return null;
  }

  /** Validates a whole registration payload. Returns [{ field, message }]. */
  function validateRegistration(data, today = new Date()) {
    const errors = [];
    for (const [field, validate] of Object.entries(fieldValidators)) {
      const message = validate(data ? data[field] : undefined, today);
      if (message) errors.push({ field, message });
    }
    const docError = validateDocument(data && data.document);
    if (docError) errors.push({ field: 'document', message: docError });
    const photoError = validatePhoto(data && data.photo);
    if (photoError) errors.push({ field: 'photo', message: photoError });
    return errors;
  }

  function priceFor(ticketType, tickets) {
    const type = TICKET_TYPES.find((t) => t.code === ticketType);
    const qty = Number(tickets);
    if (!type || !Number.isInteger(qty) || qty < 1) return 0;
    return type.price * qty;
  }

  return {
    TICKET_TYPES,
    LIMITS,
    DOCUMENT_TYPES,
    PHOTO_TYPES,
    fieldValidators,
    validateDocument,
    validatePhoto,
    validateRegistration,
    priceFor,
    dateWindow,
    toIsoDate,
    addDays,
    parseIsoDate,
  };
});
