import { Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { LinkRow } from '@/components/ui/LinkRow';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/lib/design/use-theme';
import type { OrganizedEvent } from '@/lib/events/highlights';

import { EventCard } from './EventCard';

type MyEventsProps = {
  events: OrganizedEvent[];
  pastCount: number;
  onOpenDashboard: (id: string) => void;
  onShare: (id: string) => void;
  onOpenPast: () => void;
  onCreate: () => void;
};

/** Écran A2 : les événements qu'on organise. */
export function MyEvents({
  events,
  pastCount,
  onOpenDashboard,
  onShare,
  onOpenPast,
  onCreate,
}: MyEventsProps) {
  const { t } = useTranslation();
  const { spacing } = useTheme();

  return (
    <Screen
      aboveTabBar
      footer={
        <Button
          label={t('myEvents.create')}
          icon={<Icon as={Plus} color="onPrimary" />}
          onPress={onCreate}
        />
      }>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="display" accessibilityRole="header">
          {t('tabs.events')}
        </AppText>
        <AppText variant="bodyStrong" color="textMuted">
          {t('myEvents.subtitle')}
        </AppText>
      </View>

      {events.length > 0 ? (
        <View style={{ gap: spacing.md }}>
          {events.map(({ event, highlights }) => (
            <EventCard
              key={event.id}
              event={event}
              highlights={highlights}
              onOpenDashboard={() => onOpenDashboard(event.id)}
              onShare={() => onShare(event.id)}
            />
          ))}
        </View>
      ) : (
        <AppText variant="heading">{t('myEvents.empty')}</AppText>
      )}

      {pastCount > 0 ? (
        <LinkRow label={t('myEvents.past', { count: pastCount })} onPress={onOpenPast} />
      ) : null}
    </Screen>
  );
}
