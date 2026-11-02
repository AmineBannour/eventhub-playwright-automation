export type TicketType = 'standard' | 'vip' | 'student';

export interface FileMeta {
  name: string;
  size: number;
  type: string;
  width?: number;
  height?: number;
}

/** Payload accepted by POST/PUT /api/registrations. Loose types allow negative tests. */
export interface RegistrationInput {
  fullName: string;
  email: string;
  age: number | string;
  tickets: number | string;
  ticketType: TicketType | string;
  eventDate: string;
  notes?: string;
  document?: FileMeta | null;
  photo?: FileMeta | null;
}

export interface Registration extends Required<Omit<RegistrationInput, 'age' | 'tickets'>> {
  id: string;
  reference: string;
  age: number;
  tickets: number;
  totalPrice: number;
  currency: 'EUR';
  createdAt: string;
  updatedAt: string;
}

export interface ValidationErrorBody {
  error: string;
  details: { field: string; message: string }[];
}
