import type { Booking } from './types';

export type SeatSlot =
  | { kind: 'booked'; name?: string; /** 0 pour la personne, 1 pour « +1 »… */ extra: number }
  | { kind: 'free' };

export function bookedSeats(bookings: Booking[]): number {
  return bookings.reduce((sum, booking) => sum + booking.seats, 0);
}

export function freeSeats(bookings: Booking[], total: number): number {
  return Math.max(total - bookedSeats(bookings), 0);
}

/** Un siège par place : d'abord les réservations dans l'ordre, puis les places libres. */
export function seatSlots(bookings: Booking[], total: number): SeatSlot[] {
  const booked = bookings.flatMap(({ name, seats }) =>
    Array.from({ length: seats }, (_, extra): SeatSlot => ({ kind: 'booked', name, extra }))
  );
  const free = Array.from({ length: freeSeats(bookings, total) }, (): SeatSlot => ({
    kind: 'free',
  }));
  return [...booked, ...free].slice(0, total);
}

/** Le conducteur note une place prise (réservée par téléphone, par exemple). */
export function takeSeat(bookings: Booking[], total: number): Booking[] {
  if (freeSeats(bookings, total) === 0) return bookings;
  return [...bookings, { id: `manual-${Date.now()}-${bookings.length}`, seats: 1 }];
}

/** Libère la dernière place prise. */
export function releaseSeat(bookings: Booking[]): Booking[] {
  const last = bookings.at(-1);
  if (!last) return bookings;
  const rest = bookings.slice(0, -1);
  return last.seats > 1 ? [...rest, { ...last, seats: last.seats - 1 }] : rest;
}
