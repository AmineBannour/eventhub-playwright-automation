import type { APIRequestContext, APIResponse, TestInfo } from '@playwright/test';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface ApiResult<T = unknown> {
  status: number;
  headers: Record<string, string>;
  body: T;
  response: APIResponse;
}

export interface SendOptions {
  data?: unknown;
  /** Raw string body, used to send deliberately malformed JSON. */
  rawBody?: string;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  /** Overrides the client token for this call (null = send no Authorization header). */
  token?: string | null;
}

const SENSITIVE_KEYS = ['authorization', 'password', 'token'];

/** Replaces secrets with a placeholder so reports never contain credentials. */
function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) =>
        SENSITIVE_KEYS.includes(k.toLowerCase()) ? [k, '***REDACTED***'] : [k, redact(v)],
      ),
    );
  }
  return value;
}

/**
 * Base class for all API clients: builds requests, applies authentication,
 * parses JSON and attaches a redacted request/response record to the
 * Playwright report as execution evidence.
 */
export abstract class BaseApiClient {
  private exchangeCount = 0;

  constructor(
    protected readonly request: APIRequestContext,
    protected token: string | null = null,
    private readonly testInfo?: TestInfo,
  ) {}

  setToken(token: string | null): void {
    this.token = token;
  }

  protected async send<T = unknown>(method: HttpMethod, url: string, options: SendOptions = {}): Promise<ApiResult<T>> {
    const token = options.token === undefined ? this.token : options.token;
    const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (options.rawBody !== undefined) headers['Content-Type'] = 'application/json';

    const started = Date.now();
    const response = await this.request.fetch(url, {
      method,
      headers,
      params: options.params,
      data: options.rawBody ?? options.data,
    });
    const text = await response.text();
    let body: unknown = text;
    if ((response.headers()['content-type'] ?? '').includes('application/json') && text) body = JSON.parse(text);

    await this.attachEvidence({
      request: { method, url, params: options.params, headers, body: options.rawBody ?? options.data },
      response: { status: response.status(), headers: response.headers(), body },
      durationMs: Date.now() - started,
    });
    return { status: response.status(), headers: response.headers(), body: body as T, response };
  }

  private async attachEvidence(exchange: object): Promise<void> {
    if (!this.testInfo) return;
    this.exchangeCount += 1;
    const record = exchange as { request: { method: string; url: string } };
    await this.testInfo.attach(`api-${this.exchangeCount} ${record.request.method} ${record.request.url}`, {
      body: JSON.stringify(redact(exchange), null, 2),
      contentType: 'application/json',
    });
  }
}
