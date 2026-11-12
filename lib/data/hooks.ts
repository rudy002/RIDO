import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useTheme } from '@/lib/design/use-theme';

import { eventById, eventSummary, myParticipant } from './selectors';
import { isBackendConnected, loadEventPreview, useAppData } from './store';

/**
 * Pour un écran d'événement : l'événement, son résumé dans la langue active, et mon inscription.
 * Un événement inconnu de l'appareil (lien reçu) est demandé au serveur : `loading` le temps de
 * la réponse.
 */
export function useEventContext(id: string | undefined) {
  const data = useAppData();
  const { language } = useTheme();
  const event = id ? eventById(data, id) : undefined;
  const summary = useMemo(
    () => (event ? eventSummary(data, event, language) : undefined),
    [data, event, language]
  );
  const me = event ? myParticipant(data, event.id) : undefined;

  // Lien sans réponse du serveur (supprimé, mal copié) : on cesse d'attendre.
  const [missing, setMissing] = useState<string | null>(null);
  const known = event !== undefined;
  useEffect(() => {
    if (!id || known || !isBackendConnected()) return;
    let active = true;
    void loadEventPreview(id).then((found) => {
      if (active && !found) setMissing(id);
    });
    return () => {
      active = false;
    };
  }, [id, known]);

  const loading = !event && Boolean(id) && isBackendConnected() && missing !== id;
  return { data, event, summary, me, language, loading };
}

/**
 * Lance une action une seule fois à la fois : un double appui pendant que le serveur répond
 * n'envoie pas l'action deux fois.
 */
export function useSingleFlight() {
  const running = useRef(false);
  return useCallback(async (task: () => Promise<void>) => {
    if (running.current) return;
    running.current = true;
    try {
      await task();
    } finally {
      running.current = false;
    }
  }, []);
}
