import { expect } from '@playwright/test';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as schemas from './schemas';
import type { ApiResult } from '../clients/BaseApiClient';
import type { ValidationErrorBody } from './types';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
Object.values(schemas).forEach((schema) => ajv.addSchema(schema));

export type SchemaName = 'registration' | 'registrationList' | 'token' | 'health' | 'ticketTypes' | 'error';

/** Contract assertion: the body must match the named JSON Schema. Lists every violation on failure. */
export function expectSchema(body: unknown, schema: SchemaName): void {
  const validate = ajv.getSchema(schema);
  if (!validate) throw new Error(`Unknown schema ${schema}`);
  const valid = validate(body);
  expect(valid, `response does not match "${schema}" schema:\n${ajv.errorsText(validate.errors, { separator: '\n' })}`).toBe(true);
}

export function expectJson(result: ApiResult): void {
  expect(result.headers['content-type']).toMatch(/^application\/json/);
}

/** A 400 response must name the failing field and carry the documented message. */
export function expectValidationError(result: ApiResult, field: string, message: string): void {
  expect(result.status).toBe(400);
  expectSchema(result.body, 'error');
  const body = result.body as ValidationErrorBody;
  expect(body.error).toBe('Validation failed');
  expect(body.details).toContainEqual({ field, message });
}
