import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useTheme } from '@/lib/design/use-theme';
import type { OrganizedEvent } from '@/lib/events/highlights';

import { EventCard } from './EventCard';

type PastEventsProps = {
  events: OrganizedEvent[];
  onBack: () => void;
  onOpenDashboard: (id: string) => void;
};

/** Événements terminés qu'on a organisés, du plus récent au plus ancien. */
export function PastEvents({ events, onBack, onOpenDashboard }: PastEventsProps) {
  const { t } = useTranslation();
  const { spacing } = useTheme();

  return (
    <Screen>
      <ScreenHeader action="back" onAction={onBack} title={t('tabs.events')} />
      <AppText variant="title" accessibilityRole="header">
        {t('myEvents.pastTitle')}
      </AppText>
      <View style={{ gap: spacing.md }}>
        {events.length > 0 ? (
          events.map(({ event, highlights }) => (
            <EventCard
              key={event.id}
              event={event}
              highlights={highlights}
              onOpenDashboard={() => onOpenDashboard(event.id)}
            />
          ))
        ) : (
          <AppText color="textMuted">{t('myEvents.pastEmpty')}</AppText>
        )}
      </View>
    </Screen>
  );
}
