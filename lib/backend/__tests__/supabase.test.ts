import { AuthApiError, AuthRetryableFetchError, type Session } from '@supabase/supabase-js';

import { openSession } from '@/lib/backend/supabase';

const session = { access_token: 'token', user: { id: 'user-1' } } as Session;

function fakeAuth(stored: { session: Session | null; error: Error | null }) {
  return {
    getSession: jest
      .fn()
      .mockResolvedValue({ data: { session: stored.session }, error: stored.error }),
    signInAnonymously: jest
      .fn()
      .mockResolvedValue({ data: { session, user: session.user }, error: null }),
  };
}

describe('openSession', () => {
  it('reprend le compte déjà créé sur cet appareil', async () => {
    const auth = fakeAuth({ session, error: null });
    await expect(openSession(auth)).resolves.toBe(session);
    expect(auth.signInAnonymously).not.toHaveBeenCalled();
  });

  it('crée un compte invisible au premier lancement', async () => {
    const auth = fakeAuth({ session: null, error: null });
    await expect(openSession(auth)).resolves.toBe(session);
    expect(auth.signInAnonymously).toHaveBeenCalledTimes(1);
  });

  it('sans réseau, ne crée pas un nouveau compte à la place de l’ancien', async () => {
    const auth = fakeAuth({ session: null, error: new AuthRetryableFetchError('offline', 0) });
    await expect(openSession(auth)).rejects.toThrow('offline');
    expect(auth.signInAnonymously).not.toHaveBeenCalled();
  });

  it('recrée un compte si le serveur ne reconnaît plus l’ancien', async () => {
    const auth = fakeAuth({
      session: null,
      error: new AuthApiError('Invalid Refresh Token', 400, 'refresh_token_not_found'),
    });
    await expect(openSession(auth)).resolves.toBe(session);
    expect(auth.signInAnonymously).toHaveBeenCalledTimes(1);
  });

  it('signale un refus du serveur', async () => {
    const auth = fakeAuth({ session: null, error: null });
    auth.signInAnonymously.mockResolvedValue({
      data: { session: null, user: null },
      error: new AuthApiError(
        'Anonymous sign-ins are disabled',
        422,
        'anonymous_provider_disabled'
      ),
    });
    await expect(openSession(auth)).rejects.toThrow('Anonymous sign-ins are disabled');
  });
});
