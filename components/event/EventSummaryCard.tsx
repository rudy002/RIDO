import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/lib/design/use-theme';
import type { EventSummary } from '@/lib/events/types';
import { formatSchedule } from '@/lib/i18n/format';

type EventSummaryCardProps = {
  event: Pick<EventSummary, 'type' | 'title' | 'startsAt' | 'endsAt' | 'venue' | 'directions'>;
};

/** Résumé d'un événement : type, nom, date et heures, lieu et trajets organisés. */
export function EventSummaryCard({ event }: EventSummaryCardProps) {
  const { t } = useTranslation();
  const { spacing, language } = useTheme();
  const { type, title, startsAt, endsAt, venue, directions } = event;
  const trips =
    directions.length > 1 ? t('event.directions.both') : t(`event.directions.${directions[0]}`);

  return (
    <Card style={{ gap: spacing.sm }}>
      <Badge tone="accent" label={t(`event.types.${type}`)} />
      <AppText variant="heading">{title}</AppText>
      <AppText color="textMuted">{formatSchedule(startsAt, endsAt, language)}</AppText>
      <AppText color="textMuted">{directions.length > 0 ? `${venue} · ${trips}` : venue}</AppText>
    </Card>
  );
}
