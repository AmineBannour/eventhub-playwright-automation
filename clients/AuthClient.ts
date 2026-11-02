import { expect } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';

export interface TokenResponse {
  token: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export class AuthClient extends BaseApiClient {
  requestToken(username?: string, password?: string) {
    return this.send<TokenResponse & { error?: string }>('POST', '/api/auth/token', { data: { username, password }, token: null });
  }

  /** Convenience for setup code: returns a token or fails loudly. */
  async getToken(username: string, password: string): Promise<string> {
    const result = await this.requestToken(username, password);
    expect(result.status, 'authentication must succeed during test setup').toBe(200);
    return result.body.token;
  }
}
