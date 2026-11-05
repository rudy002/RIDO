import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { StatTile } from '@/components/ui/StatTile';
import { useTheme } from '@/lib/design/use-theme';
import type { EventSummary } from '@/lib/events/types';

import { EventHeroCard } from './EventHeroCard';
import { HowItWorks } from './HowItWorks';

type EventInvitationProps = {
  event: EventSummary;
  onJoin: () => void;
};

/** Écran I1 : invitation à rejoindre le covoiturage d'un événement. */
export function EventInvitation({ event, onJoin }: EventInvitationProps) {
  const { t } = useTranslation();
  const { spacing } = useTheme();

  return (
    <Screen
      footer={
        <>
          <Button label={t('invitation.join')} onPress={onJoin} />
          <AppText variant="label" color="textMuted" style={{ textAlign: 'center' }}>
            {t('invitation.joinHint')}
          </AppText>
        </>
      }>
      <AppText variant="title" accessibilityRole="header">
        {t('app.name')}
      </AppText>

      <EventHeroCard
        type={event.type}
        title={event.title}
        startsAt={event.startsAt}
        endsAt={event.endsAt}
        venue={event.venue}
        organizerName={event.organizerName}
      />

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <StatTile
          tone="success"
          value={String(event.seatsOffered)}
          label={t('event.seatsOffered', { count: event.seatsOffered })}
        />
        <StatTile
          value={String(event.guestsCount)}
          label={t('event.guests', { count: event.guestsCount })}
        />
      </View>

      <HowItWorks />
    </Screen>
  );
}
