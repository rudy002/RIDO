import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { Share } from 'react-native';

import type { EventSummary } from '@/lib/events/types';
import { eventShareUrl } from '@/lib/events/share';

/** Partage le lien d'un événement : feuille de partage du système, sinon copie du lien (web). */
export function useShareEvent(): (event: EventSummary) => void {
  const { t } = useTranslation();

  return (event) => {
    const link = eventShareUrl(event.id);
    void Share.share({ message: t('eventReady.message', { name: event.title, link }) }).catch(() =>
      Clipboard.setStringAsync(link)
    );
  };
}
