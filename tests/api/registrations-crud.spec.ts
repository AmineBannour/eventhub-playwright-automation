import { randomUUID } from 'node:crypto';
import { test, expect } from '../../fixtures/test-fixtures';
import { buildRegistration } from '../../test-data/registration.factory';
import { expectJson, expectSchema } from '../../utils/assertions';
import { bookableDate } from '../../utils/dates';

test.describe('Registrations CRUD', () => {
  // API-03 (Lilian): CREATE - POST a new registration and check everything the API returns.
  test('API-03 POST /api/registrations creates a registration (201, Location, schema, computed total) @crud @schema @positive', async ({
    registrationApi,
  }) => {
    const input = buildRegistration({
      email: `Mixed.Case.${randomUUID().slice(0, 6)}@EventHub.test`,
      ticketType: 'student',
      tickets: 3,
      document: { name: 'passport.pdf', size: 20480, type: 'application/pdf' },
    });

    // Send the create request.
    const result = await registrationApi.create(input);

    // 201 Created, JSON matching our schema, and a Location header pointing to the new record.
    expect(result.status).toBe(201);
    expectJson(result);
    expectSchema(result.body, 'registration');
    expect(result.headers.location).toBe(`/api/registrations/${result.body.id}`);
    expect(result.body).toMatchObject({
      fullName: input.fullName,
      email: input.email.toLowerCase(), // emails are normalised
      ticketType: 'student',
      tickets: 3,
      totalPrice: 57, // 3 x 19 EUR, computed by the server
      document: input.document,
      photo: null,
    });
    expect(result.body.createdAt).toBe(result.body.updatedAt);

    // Follow the Location header: we get back exactly what was created.
    const fetched = await registrationApi.getByUrl(result.headers.location);
    expect(fetched.status, 'Location header points at the new resource').toBe(200);
    expect(fetched.body).toEqual(result.body);
  });

  // API-04 (Lilian): READ - get one registration by id, search by email, and try an unknown id.
  test('API-04 GET returns a registration by id, filters the list by email, and 404s for unknown ids @crud @negative', async ({
    registrationApi,
  }) => {
    // Precondition: create our own registration through the API.
    const { body: created } = await registrationApi.create(buildRegistration());

    // Read it back by id: identical to what was created.
    await test.step('GET by id', async () => {
      const result = await registrationApi.get(created.id);
      expect(result.status).toBe(200);
      expectSchema(result.body, 'registration');
      expect(result.body).toEqual(created);
    });

    // Search by email: only our registration comes back.
    await test.step('GET list filtered by email returns only this registration', async () => {
      const result = await registrationApi.list({ email: created.email });
      expect(result.status).toBe(200);
      expectSchema(result.body, 'registrationList');
      expect(result.body.total).toBe(1);
      expect(result.body.items.map((r) => r.id)).toEqual([created.id]);
    });

    // A random id that does not exist: 404 Not Found.
    await test.step('GET unknown id -> 404 with an error message', async () => {
      const result = await registrationApi.get(randomUUID());
      expect(result.status).toBe(404);
      expect(result.body).toEqual({ error: 'Registration not found' });
    });
  });

  // API-05 (Lilian): UPDATE - change a registration with PUT and check the change is saved.
  test('API-05 PUT updates a registration and the change is persisted @crud @positive', async ({ registrationApi }) => {
    const original = buildRegistration({ ticketType: 'standard', tickets: 1 });
    const { body: created } = await registrationApi.create(original);

    // New values: name, number of tickets, ticket type and date.
    const changes = { ...original, fullName: 'Ada King', tickets: 4, ticketType: 'vip', eventDate: bookableDate(60) };
    const result = await registrationApi.update(created.id, changes);

    expect(result.status).toBe(200);
    expectSchema(result.body, 'registration');
    expect(result.body).toMatchObject({ id: created.id, reference: created.reference, fullName: 'Ada King', tickets: 4, totalPrice: 596 });
    expect(result.body.createdAt).toBe(created.createdAt);
    expect(Date.parse(result.body.updatedAt)).toBeGreaterThan(Date.parse(created.updatedAt));

    // Read it again, to prove the update was really saved.
    const reread = await registrationApi.get(created.id);
    expect(reread.body).toEqual(result.body);
  });

  // API-06 (Lilian): DELETE - remove a registration, then check it is really gone.
  test('API-06 DELETE removes a registration; repeated delete and later reads return 404 @crud @negative', async ({ registrationApi }) => {
    const { body: created } = await registrationApi.create(buildRegistration());

    // Delete it: 204 No Content (empty body).
    const deleted = await registrationApi.remove(created.id);
    expect(deleted.status).toBe(204);
    expect(deleted.body, '204 has no body').toBe('');

    // Reading it or deleting it again now gives 404.
    expect((await registrationApi.get(created.id)).status).toBe(404);
    const again = await registrationApi.remove(created.id);
    expect(again.status).toBe(404);
    expect(again.body).toEqual({ error: 'Registration not found' });
  });
});
