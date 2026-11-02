import { BaseApiClient } from './BaseApiClient';

export interface Health {
  status: string;
  version: string;
  uptimeSeconds: number;
}

export interface TicketTypeInfo {
  code: string;
  label: string;
  price: number;
  currency: string;
}

/** Endpoints that need no authentication. */
export class PublicClient extends BaseApiClient {
  health() {
    return this.send<Health>('GET', '/api/health', { token: null });
  }

  ticketTypes() {
    return this.send<TicketTypeInfo[]>('GET', '/api/ticket-types', { token: null });
  }

  /** Any unauthenticated GET, e.g. to probe unknown routes. */
  get<T = unknown>(path: string) {
    return this.send<T>('GET', path, { token: null });
  }
}
