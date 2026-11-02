import { test, expect } from '../../fixtures/test-fixtures';
import { buildRegistration } from '../../test-data/registration.factory';
import { numericBoundaries, rangeMessage } from '../../test-data/boundaries';
import { invalidPayloads } from '../../test-data/api-invalid-payloads';
import { expectSchema, expectValidationError } from '../../utils/assertions';

test.describe('Registrations - validation & error handling', () => {
  // Data-driven. Boundary values reuse the same data table as the UI boundary test.
  // API-07 (Salma): age and ticket limits - valid values give 201, invalid ones give 400 with the right message.
  for (const { field, value, valid } of numericBoundaries) {
    test(`API-07 [boundary ${field}=${value}] -> ${valid ? '201' : '400'} @boundary @data-driven`, async ({ registrationApi }) => {
      const result = await registrationApi.create(buildRegistration({ [field]: value }));

      if (valid) {
        expect(result.status).toBe(201);
        expect(result.body[field]).toBe(value);
      } else {
        expectValidationError(result, field, rangeMessage(field));
      }
    });
  }

  // API-07 (Salma): one test per invalid payload (bad email, past date, Sunday...) - each must return 400 naming the field.
  for (const { name, override, field, message } of invalidPayloads) {
    test(`API-07 [${name}] -> 400 with a field error @negative @validation @data-driven`, async ({ registrationApi }) => {
      const result = await registrationApi.create(buildRegistration(override));
      expectValidationError(result, field, message);
    });
  }

  // API-08 (Issraa): error handling - duplicate email, empty body and broken JSON.
  test('API-08 duplicate email, empty body and malformed JSON return clear errors @negative @error-handling', async ({
    registrationApi,
  }) => {
    // The same email twice (even in capitals): 409 Conflict.
    await test.step('duplicate email (different case) -> 409 Conflict', async () => {
      const first = buildRegistration();
      expect((await registrationApi.create(first)).status).toBe(201);
      const result = await registrationApi.create({ ...first, email: first.email.toUpperCase() });
      expect(result.status).toBe(409);
      expect(result.body).toEqual({ error: 'A registration with this email already exists' });
    });

    // Empty request: 400 listing every missing field.
    await test.step('empty body -> 400 listing every required field', async () => {
      const result = await registrationApi.create({});
      expect(result.status).toBe(400);
      expectSchema(result.body, 'error');
      const fields = (result.body as unknown as { details: { field: string }[] }).details.map((d) => d.field);
      expect(fields).toEqual(['fullName', 'email', 'age', 'tickets', 'ticketType', 'eventDate']);
    });

    // Broken JSON: 400 with a clear message.
    await test.step('malformed JSON -> 400', async () => {
      const result = await registrationApi.createRaw('{"fullName": "Ada", ');
      expect(result.status).toBe(400);
      expect(result.body).toEqual({ error: 'Malformed JSON body' });
    });
  });
});
