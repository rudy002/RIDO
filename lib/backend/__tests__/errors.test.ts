import { AuthRetryableFetchError } from '@supabase/supabase-js';

import { BackendError, toBackendError } from '@/lib/backend/errors';

// Messages réels des fonctions du serveur (supabase/migrations) et des clients hors ligne.
describe('raison d’un refus du serveur', () => {
  it.each([
    [{ message: 'not enough free seats', code: 'P0001' }, 'full'],
    [{ message: 'car is full', code: 'P0001' }, 'full'],
    [{ message: 'event not found', code: 'P0002' }, 'gone'],
    [{ message: 'ride not found', code: 'P0002' }, 'gone'],
    [{ message: 'not a passenger of this event', code: 'P0001' }, 'gone'],
    [{ message: 'direction not offered by this event', code: 'P0001' }, 'gone'],
    [new TypeError('Network request failed'), 'offline'], // Android / iOS
    [new TypeError('Failed to fetch'), 'offline'], // Chrome
    [new TypeError('Load failed'), 'offline'], // Safari
    [new AuthRetryableFetchError('fetch failed', 0), 'offline'],
    [{ message: 'new row violates check constraint', code: '23514' }, 'unknown'],
  ])('%j → %s', (error, kind) => {
    expect(toBackendError(error).kind).toBe(kind);
  });

  it('garde une raison déjà connue', () => {
    const known = new BackendError('full', 'x');
    expect(toBackendError(known)).toBe(known);
  });
});
