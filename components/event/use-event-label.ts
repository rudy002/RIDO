import { useTranslation } from 'react-i18next';

import { useTheme } from '@/lib/design/use-theme';
import type { EventSummary } from '@/lib/events/types';
import { elisionContext } from '@/lib/i18n/elision';
import { formatShortDate } from '@/lib/i18n/format';

/** Pastille de contexte d'un écran de trajet : « Mariage de Léa et Samuel · 14 juin ». */
export function useEventLabel(event: EventSummary | undefined): string {
  const { t } = useTranslation();
  const { language } = useTheme();
  if (!event) return '';
  return t('rides.eventLabel', {
    type: t(`event.types.${event.type}`),
    title: event.title,
    date: formatShortDate(event.startsAt, language),
    context: elisionContext(event.title),
  });
}
