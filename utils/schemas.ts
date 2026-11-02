/** JSON Schemas (draft-07) describing the API contract. */
const fileMeta = {
  type: ['object', 'null'],
  required: ['name', 'size', 'type'],
  properties: {
    name: { type: 'string' },
    size: { type: 'integer', minimum: 0 },
    type: { type: 'string' },
    width: { type: 'integer' },
    height: { type: 'integer' },
  },
  additionalProperties: false,
};

export const registrationSchema = {
  $id: 'registration',
  type: 'object',
  required: ['id', 'reference', 'fullName', 'email', 'age', 'tickets', 'ticketType', 'eventDate', 'notes', 'document', 'photo', 'totalPrice', 'currency', 'createdAt', 'updatedAt'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    reference: { type: 'string', pattern: '^EVH-[0-9A-F]{6}$' },
    fullName: { type: 'string', minLength: 2, maxLength: 50 },
    email: { type: 'string', format: 'email' },
    age: { type: 'integer', minimum: 18, maximum: 99 },
    tickets: { type: 'integer', minimum: 1, maximum: 10 },
    ticketType: { enum: ['standard', 'vip', 'student'] },
    eventDate: { type: 'string', format: 'date' },
    notes: { type: 'string', maxLength: 500 },
    document: fileMeta,
    photo: fileMeta,
    totalPrice: { type: 'number', minimum: 0 },
    currency: { const: 'EUR' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  additionalProperties: false,
};

export const registrationListSchema = {
  $id: 'registrationList',
  type: 'object',
  required: ['items', 'total'],
  properties: {
    items: { type: 'array', items: { $ref: 'registration' } },
    total: { type: 'integer', minimum: 0 },
  },
  additionalProperties: false,
};

export const tokenSchema = {
  $id: 'token',
  type: 'object',
  required: ['token', 'tokenType', 'expiresIn'],
  properties: {
    token: { type: 'string', pattern: '^[0-9a-f]{48}$' },
    tokenType: { const: 'Bearer' },
    expiresIn: { type: 'integer', minimum: 1 },
  },
  additionalProperties: false,
};

export const healthSchema = {
  $id: 'health',
  type: 'object',
  required: ['status', 'version', 'uptimeSeconds'],
  properties: {
    status: { const: 'ok' },
    version: { type: 'string', pattern: String.raw`^\d+\.\d+\.\d+$` /* semver; String.raw keeps the backslashes */ },
    uptimeSeconds: { type: 'integer', minimum: 0 },
  },
};

export const ticketTypesSchema = {
  $id: 'ticketTypes',
  type: 'array',
  minItems: 1,
  items: {
    type: 'object',
    required: ['code', 'label', 'price', 'currency'],
    properties: {
      code: { type: 'string' },
      label: { type: 'string' },
      price: { type: 'number', exclusiveMinimum: 0 },
      currency: { const: 'EUR' },
    },
    additionalProperties: false,
  },
};

export const errorSchema = {
  $id: 'error',
  type: 'object',
  required: ['error'],
  properties: {
    error: { type: 'string', minLength: 1 },
    details: {
      type: 'array',
      items: {
        type: 'object',
        required: ['field', 'message'],
        properties: { field: { type: 'string' }, message: { type: 'string' } },
      },
    },
  },
};
