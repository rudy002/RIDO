import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { StatTile } from '@/components/ui/StatTile';
import { useTheme } from '@/lib/design/use-theme';
import type { EventHighlights } from '@/lib/events/highlights';
import type { EventSummary } from '@/lib/events/types';
import { formatShortWeekdayDate } from '@/lib/i18n/format';

type EventCardProps = {
  event: Pick<EventSummary, 'type' | 'title' | 'startsAt' | 'guestsCount'>;
  highlights: EventHighlights;
  onOpenDashboard: () => void;
  onShare: () => void;
};

/** Un événement qu'on organise : où en est le covoiturage, et les actions utiles. */
export function EventCard({ event, highlights, onOpenDashboard, onShare }: EventCardProps) {
  const { t } = useTranslation();
  const { spacing, radius, language } = useTheme();
  const allSet = highlights.status === 'allSet';

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <AppText variant="label" color="textMuted" style={{ flex: 1 }}>
          {`${t(`event.types.${event.type}`)} · ${formatShortWeekdayDate(event.startsAt, language, { capitalize: false })}`}
        </AppText>
        <AppText variant="label" color="textMuted">
          {t('dashboard.registered', { count: event.guestsCount })}
        </AppText>
      </View>

      <AppText variant="heading" accessibilityRole="header">
        {event.title}
      </AppText>

      {allSet ? (
        <>
          <Card
            tone="success"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              padding: spacing.md,
              borderRadius: radius.lg,
            }}>
            <Icon as={Check} color="successText" />
            <AppText variant="label" color="successText">
              {t('myEvents.allSet')}
            </AppText>
          </Card>
          <Button variant="outline" label={t('myEvents.dashboard')} onPress={onOpenDashboard} />
        </>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <StatTile
              size="small"
              tone="success"
              value={String(highlights.freeSeats)}
              label={t('dashboard.stats.freeSeats', { count: highlights.freeSeats })}
            />
            <StatTile
              size="small"
              tone={highlights.unmatched > 0 ? 'danger' : 'neutral'}
              value={String(highlights.unmatched)}
              label={t('dashboard.stats.unmatched', { count: highlights.unmatched })}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Button
              variant="inverse"
              style={{ flex: 1, paddingHorizontal: spacing.md }}
              label={t('myEvents.dashboard')}
              onPress={onOpenDashboard}
            />
            <Button
              variant="outline"
              style={{ flex: 1, paddingHorizontal: spacing.md }}
              label={t('dashboard.share')}
              onPress={onShare}
            />
          </View>
        </>
      )}
    </Card>
  );
}
