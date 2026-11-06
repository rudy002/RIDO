import { freeSeats, releaseSeat, seatSlots, takeSeat } from '../bookings';
import type { Booking } from '../types';

const ESTHER: Booking = { id: 'esther', name: 'Esther', seats: 2 };

describe('réservations', () => {
  it('place les réservations puis les sièges libres', () => {
    expect(seatSlots([ESTHER], 3)).toEqual([
      { kind: 'booked', name: 'Esther', extra: 0 },
      { kind: 'booked', name: 'Esther', extra: 1 },
      { kind: 'free' },
    ]);
    expect(freeSeats([ESTHER], 3)).toBe(1);
  });

  it('note une place prise tant qu’il en reste', () => {
    const full = takeSeat([ESTHER], 3);
    expect(freeSeats(full, 3)).toBe(0);
    expect(full.at(-1)?.seats).toBe(1);
    expect(full.at(-1)?.name).toBeUndefined();
    expect(takeSeat(full, 3)).toBe(full);
  });

  it('libère la dernière place prise', () => {
    expect(releaseSeat([ESTHER])).toEqual([{ ...ESTHER, seats: 1 }]);
    expect(releaseSeat([{ ...ESTHER, seats: 1 }])).toEqual([]);
    expect(releaseSeat([])).toEqual([]);
  });
});
