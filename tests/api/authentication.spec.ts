import { test, expect } from '../../fixtures/test-fixtures';
import { env } from '../../config/env';
import { expectSchema } from '../../utils/assertions';

test.describe('Authentication & authorization', () => {
  // API-02 (Amine): you only get a token with the right password, and protected endpoints require it.
  test('API-02 tokens are issued only for valid credentials and protected endpoints require one @auth @negative @schema', async ({
    authClient,
    registrationApi,
  }) => {
    // Right username and password: we receive a token.
    await test.step('valid credentials -> 200 with a bearer token', async () => {
      const result = await authClient.requestToken(env.credentials.username, env.credentials.password);
      expect(result.status).toBe(200);
      expectSchema(result.body, 'token');
      expect(result.body.expiresIn).toBe(3600);
    });

    // Wrong password: 401 Unauthorized and no token.
    await test.step('wrong password -> 401 without a token', async () => {
      const result = await authClient.requestToken(env.credentials.username, 'wrong-password');
      expect(result.status).toBe(401);
      expect(result.body).toEqual({ error: 'Invalid username or password' });
    });

    // Missing password: 400 Bad Request.
    await test.step('missing password -> 400', async () => {
      const result = await authClient.requestToken(env.credentials.username);
      expect(result.status).toBe(400);
      expect(result.body.error).toBe('Username and password are required');
    });

    // No token at all: the protected endpoint refuses with 401.
    await test.step('no Authorization header -> 401 + WWW-Authenticate', async () => {
      const result = await registrationApi.list({}, { token: null });
      expect(result.status).toBe(401);
      expect(result.headers['www-authenticate']).toBe('Bearer');
      expect(result.body).toEqual({ error: 'Authentication required' });
    });

    // A made-up token is refused too.
    await test.step('forged token -> 401 invalid_token', async () => {
      const result = await registrationApi.list({}, { token: 'f'.repeat(48) });
      expect(result.status).toBe(401);
      expect(result.headers['www-authenticate']).toContain('invalid_token');
      expect(result.body).toEqual({ error: 'Invalid or expired token' });
    });

    // With a real token, the same request works.
    await test.step('valid token -> 200', async () => {
      const result = await registrationApi.list();
      expect(result.status).toBe(200);
      expectSchema(result.body, 'registrationList');
    });
  });
});
