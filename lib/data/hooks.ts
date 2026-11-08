import { useMemo } from 'react';

import { useTheme } from '@/lib/design/use-theme';

import { eventById, eventSummary, myParticipant } from './selectors';
import { useAppData } from './store';

/** Pour un écran d'événement : l'événement, son résumé dans la langue active, et mon inscription. */
export function useEventContext(id: string | undefined) {
  const data = useAppData();
  const { language } = useTheme();
  const event = id ? eventById(data, id) : undefined;
  const summary = useMemo(
    () => (event ? eventSummary(data, event, language) : undefined),
    [data, event, language]
  );
  const me = event ? myParticipant(data, event.id) : undefined;
  return { data, event, summary, me, language };
}
