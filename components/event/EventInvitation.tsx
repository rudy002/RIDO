import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { LinkButton } from '@/components/ui/LinkButton';
import { Screen } from '@/components/ui/Screen';
import { StatTile } from '@/components/ui/StatTile';
import { useTheme } from '@/lib/design/use-theme';
import type { EventSummary } from '@/lib/events/types';
import type { RideRole } from '@/lib/rides/types';

import { EventHeroCard } from './EventHeroCard';
import { HowItWorks } from './HowItWorks';

type EventInvitationProps = {
  event: EventSummary;
  /** Déjà inscrit : son rôle, pour lui proposer son trajet plutôt qu'une nouvelle inscription. */
  registeredAs?: RideRole;
  /** L'organisateur lui-même ouvre le lien. */
  isOrganizer?: boolean;
  onJoin: () => void;
  onOpenMyRide: () => void;
  onOpenDashboard: () => void;
  /** Absent quand l'invitation est le premier écran (lien ouvert depuis WhatsApp). */
  onBack?: () => void;
};

/** Écran I1 : invitation à rejoindre le covoiturage d'un événement. */
export function EventInvitation({
  event,
  registeredAs,
  isOrganizer = false,
  onJoin,
  onOpenMyRide,
  onOpenDashboard,
  onBack,
}: EventInvitationProps) {
  const { t } = useTranslation();
  const { spacing } = useTheme();

  return (
    <Screen
      footer={
        registeredAs ? (
          <>
            <Button label={t(`invitation.myRide.${registeredAs}`)} onPress={onOpenMyRide} />
            <LinkButton label={t('invitation.editRegistration')} onPress={onJoin} />
          </>
        ) : (
          <>
            <Button label={t('invitation.join')} onPress={onJoin} />
            <AppText variant="label" color="textMuted" style={{ textAlign: 'center' }}>
              {t('invitation.joinHint')}
            </AppText>
          </>
        )
      }>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        {onBack ? <BackButton onPress={onBack} /> : null}
        <AppText variant="title" accessibilityRole="header">
          {t('app.name')}
        </AppText>
      </View>

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

      {registeredAs ? (
        <Card
          tone="success"
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Icon as={Check} color="successText" />
          <AppText variant="label" color="successText" style={{ flex: 1 }}>
            {t(`invitation.registered.${registeredAs}`)}
          </AppText>
        </Card>
      ) : (
        <HowItWorks />
      )}

      {isOrganizer ? (
        <LinkButton label={t('invitation.openDashboard')} onPress={onOpenDashboard} />
      ) : null}
    </Screen>
  );
}
