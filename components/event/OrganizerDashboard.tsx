import { Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { InfoNote } from '@/components/ui/InfoNote';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { StatTile } from '@/components/ui/StatTile';
import { useTheme } from '@/lib/design/use-theme';
import type { DirectionOverview, EventSummary, UnmatchedGuest } from '@/lib/events/types';
import { formatShortWeekdayDate, formatTime } from '@/lib/i18n/format';
import type { RideRole, TripDirection } from '@/lib/rides/types';

import { EventSwitcher } from './EventSwitcher';
import { UnmatchedRow } from './UnmatchedRow';
import { ZoneBar } from './ZoneBar';

type OrganizerDashboardProps = {
  event: EventSummary;
  /** Chiffres et listes pour chaque sens organisé. */
  overview: Partial<Record<TripDirection, DirectionOverview>>;
  /** Nombre d'événements de l'organisateur. */
  eventsCount: number;
  onSwitchEvent: () => void;
  onShare: () => void;
  onRelaunch: (guest: UnmatchedGuest) => void;
  /** L'organisateur est déjà inscrit : le bouton du bas mène à son trajet. */
  registeredAs?: RideRole;
  onJoin: () => void;
  onOpenMyRide: () => void;
};

/** Écran O3 : où en est le covoiturage de son événement, sens par sens. */
export function OrganizerDashboard({
  event,
  overview,
  eventsCount,
  onSwitchEvent,
  onShare,
  onRelaunch,
  registeredAs,
  onJoin,
  onOpenMyRide,
}: OrganizerDashboardProps) {
  const { t } = useTranslation();
  const { spacing, language } = useTheme();
  const directions = event.directions.filter((direction) => overview[direction]);
  const [direction, setDirection] = useState<TripDirection>(directions[0] ?? 'outbound');
  const current = overview[direction];

  const schedule = [
    formatShortWeekdayDate(event.startsAt, language),
    `${formatTime(event.startsAt, language)} – ${formatTime(event.endsAt, language)}`,
    t('dashboard.registered', { count: event.guestsCount }),
  ].join(' · ');

  return (
    <Screen
      footer={
        registeredAs ? (
          <Button
            variant="outlineStrong"
            label={t(`invitation.myRide.${registeredAs}`)}
            onPress={onOpenMyRide}
          />
        ) : (
          <Button variant="outlineStrong" label={t('dashboard.join')} onPress={onJoin} />
        )
      }>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <EventSwitcher
          label={t('dashboard.myEvents', { count: eventsCount })}
          onPress={onSwitchEvent}
        />
        <IconButton icon={Share2} label={t('dashboard.share')} onPress={onShare} tone="primary" />
      </View>

      <View style={{ gap: spacing.xs }}>
        <AppText variant="title" accessibilityRole="header">
          {event.title}
        </AppText>
        <AppText variant="label" color="textMuted">
          {schedule}
        </AppText>
      </View>

      {directions.length > 1 ? (
        <SegmentedControl
          value={direction}
          onChange={setDirection}
          options={directions.map((value) => ({
            value,
            label: t(`rideDetails.directions.${value}`),
          }))}
        />
      ) : null}

      {current ? (
        <>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <StatTile
              size="medium"
              value={String(current.drivers)}
              label={t('dashboard.stats.drivers', { count: current.drivers })}
            />
            <StatTile
              size="medium"
              tone="success"
              value={String(current.freeSeats)}
              label={t('dashboard.stats.freeSeats', { count: current.freeSeats })}
            />
            <StatTile
              size="medium"
              tone={current.unmatched.length > 0 ? 'danger' : 'neutral'}
              value={String(current.unmatched.length)}
              label={t('dashboard.stats.unmatched', { count: current.unmatched.length })}
            />
          </View>

          {event.guestsCount === 0 ? (
            // Personne d'inscrit : rien à résoudre, il faut d'abord partager le lien.
            <InfoNote icon={Share2} text={t('dashboard.noGuests')} />
          ) : (
            <>
              <View style={{ gap: spacing.md }}>
                <AppText variant="heading" accessibilityRole="header">
                  {t(`dashboard.unmatched.${direction}`)}
                </AppText>
                {current.unmatched.length > 0 ? (
                  current.unmatched.map((guest) => (
                    <UnmatchedRow
                      key={guest.id}
                      name={guest.name}
                      info={`${guest.city} · ${t('myCar.people', { count: guest.partySize })}`}
                      onRelaunch={() => onRelaunch(guest)}
                    />
                  ))
                ) : (
                  <Card tone="success">
                    <AppText variant="bodyStrong" color="successText">
                      {t('dashboard.unmatched.none')}
                    </AppText>
                  </Card>
                )}
              </View>

              {current.zones.length > 0 ? (
                <View style={{ gap: spacing.lg }}>
                  <AppText variant="heading" accessibilityRole="header">
                    {t('dashboard.zones')}
                  </AppText>
                  {current.zones.map(({ zone, seats, requests }) => (
                    <ZoneBar
                      key={zone}
                      name={zone}
                      text={`${t('dashboard.zone.seats', { count: seats })} · ${t('dashboard.zone.requests', { count: requests })}`}
                      ratio={requests === 0 ? 1 : seats / requests}
                      tone={seats >= requests ? 'ok' : 'alert'}
                    />
                  ))}
                </View>
              ) : null}
            </>
          )}
        </>
      ) : null}
    </Screen>
  );
}
