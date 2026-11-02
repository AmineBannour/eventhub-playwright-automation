import { test, expect } from '../../fixtures/test-fixtures';
import { expectJson, expectSchema } from '../../utils/assertions';
import { ticketPrices } from '../../test-data/registration.factory';

test.describe('Public endpoints', () => {
  // API-01 (Amine): public endpoints (no login needed) return the right data, format and headers.
  test('API-01 GET /api/health and /api/ticket-types return the documented contract and headers @smoke @schema @headers', async ({
    publicClient,
  }) => {
    // Health check: status 200, the correct JSON format and the expected headers.
    await test.step('GET /api/health', async () => {
      const result = await publicClient.health();
      expect(result.status).toBe(200);
      expectJson(result);
      expectSchema(result.body, 'health');
      expect(result.headers['cache-control']).toBe('no-store');
      expect(result.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
      expect(result.headers['x-powered-by'], 'server technology is not disclosed').toBeUndefined();
    });

    // Ticket types: the correct format and the prices the app should charge.
    await test.step('GET /api/ticket-types', async () => {
      const result = await publicClient.ticketTypes();
      expect(result.status).toBe(200);
      expectJson(result);
      expectSchema(result.body, 'ticketTypes');
      const prices = Object.fromEntries(result.body.map((t) => [t.code, t.price]));
      expect(prices).toEqual(ticketPrices);
    });

    // An address that does not exist returns a clean JSON 404 error.
    await test.step('unknown API route returns a JSON 404', async () => {
      const result = await publicClient.get('/api/does-not-exist');
      expect(result.status).toBe(404);
      expectSchema(result.body, 'error');
    });
  });
});
