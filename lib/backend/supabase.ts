import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createClient,
  isAuthRetryableFetchError,
  type Session,
  type SupabaseClient,
} from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

/*
 * Connexion au serveur (Supabase). L'adresse et la clé publique viennent de `.env.local`
 * (EXPO_PUBLIC_…) : elles sont faites pour être dans l'appli, la sécurité est assurée par les
 * règles d'accès de la base (supabase/migrations).
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;
let session: Promise<Session> | null = null;

export function isBackendConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

/**
 * Le client, créé au premier usage seulement : sur le web, les pages sont d'abord préparées sur un
 * serveur, sans stockage, où il ne doit pas démarrer.
 */
export function getSupabase(): SupabaseClient {
  if (client) return client;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      'Supabase is not configured: set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY'
    );
  }
  const created = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  // Sur mobile, la session ne se renouvelle que lorsque l'appli est ouverte (le web le gère seul).
  if (Platform.OS !== 'web') {
    AppState.addEventListener('change', (state) => {
      if (state === 'active') void created.auth.startAutoRefresh();
      else void created.auth.stopAutoRefresh();
    });
  }
  client = created;
  return created;
}

/**
 * La session de cet appareil : un compte invisible (anonyme), créé la première fois et gardé
 * ensuite. L'invité n'a rien à saisir.
 */
export function ensureSession(): Promise<Session> {
  session ??= openSession(getSupabase().auth).catch((error: unknown) => {
    session = null; // nouvel essai au prochain appel (pas de réseau, par exemple)
    throw error;
  });
  return session;
}

/** Le serveur, tel que les données de l'appli l'utilisent (lib/data/store.ts). */
export const supabaseBackend = {
  /** Le client et le compte de cet appareil (créé au besoin). */
  async user(): Promise<{ client: SupabaseClient; userId: string }> {
    const { user } = await ensureSession();
    return { client: getSupabase(), userId: user.id };
  },
  /** Oublie le compte de cet appareil (après l'avoir effacé) : le prochain appel en crée un neuf. */
  async forget(): Promise<void> {
    session = null;
    await getSupabase().auth.signOut({ scope: 'local' });
  },
};

type SessionAuth = Pick<SupabaseClient['auth'], 'getSession' | 'signInAnonymously'>;

/** Reprend la session enregistrée, ou crée le compte invisible s'il n'y en a pas. */
export async function openSession(auth: SessionAuth): Promise<Session> {
  const existing = await auth.getSession();
  if (existing.data.session) return existing.data.session;
  // Sans réseau, on ne crée surtout pas un nouveau compte : l'ancien reviendra avec le réseau.
  if (existing.error && isAuthRetryableFetchError(existing.error)) throw existing.error;

  const created = await auth.signInAnonymously();
  if (created.error) throw created.error;
  if (!created.data.session) throw new Error('Supabase returned no session');
  return created.data.session;
}
