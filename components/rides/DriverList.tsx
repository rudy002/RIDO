import { Check } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useTheme } from '@/lib/design/use-theme';
import { formatTime } from '@/lib/i18n/format';
import type { Language } from '@/lib/i18n';
import type { RideMatch, RideOffer, TripDirection } from '@/lib/rides/types';
import type { TFunction } from 'i18next';

import { DriverCard } from './DriverCard';

type DriverListProps = {
  /** Pastille du contexte : « Mariage de Léa et Samuel · 14 juin ». */
  contextLabel: string;
  passenger: { firstName: string; zone: string; partySize?: number };
  matches: RideMatch[];
  initialDirection?: TripDirection;
  onEdit: () => void;
  onOpenRide: (offer: RideOffer) => void;
  onFound: () => void;
};

const DIRECTIONS: TripDirection[] = ['outbound', 'return'];

/** Places libres chez les conducteurs de la même ville (« près de chez toi »). */
function nearbyFreeSeats(matches: RideMatch[], direction: TripDirection): number {
  return matches
    .filter(({ offer, distanceKm }) => offer.direction === direction && distanceKm === undefined)
    .reduce((sum, { offer }) => sum + Math.max(offer.seats.free, 0), 0);
}

/** « Part entre 18h00 et 18h30 · Centre » ou « Yavne, à 12 km · vers 18h00 ». */
function describeDeparture(match: RideMatch, t: TFunction, language: Language): string {
  const { home, departure } = match.offer;
  const from = formatTime(departure.from, language);
  const to = departure.to ? formatTime(departure.to, language) : undefined;

  if (match.distanceKm !== undefined) {
    const when = to
      ? t('rides.departure.windowShort', { from, to })
      : t('rides.departure.aroundShort', { time: from });
    return `${t('rides.departure.nearby', { city: home.city, distance: match.distanceKm })} · ${when}`;
  }

  const when = to
    ? t('rides.departure.window', { from, to })
    : t('rides.departure.around', { time: from });
  return home.area ? `${when} · ${home.area}` : when;
}

/** Écran P1 : conducteurs disponibles pour un passager, à l'aller ou au retour. */
export function DriverList({
  contextLabel,
  passenger,
  matches,
  initialDirection = 'outbound',
  onEdit,
  onOpenRide,
  onFound,
}: DriverListProps) {
  const { t } = useTranslation();
  const { spacing, radius, language } = useTheme();
  const [direction, setDirection] = useState<TripDirection>(initialDirection);

  const visible = useMemo(
    () =>
      matches
        .filter(({ offer }) => offer.direction === direction)
        // Les voitures complètes passent en dernier.
        .sort((a, b) => Number(a.offer.seats.free <= 0) - Number(b.offer.seats.free <= 0)),
    [matches, direction]
  );

  const nearby = nearbyFreeSeats(matches, direction);
  const greeting = [
    t('rides.greeting', { name: passenger.firstName }),
    passenger.partySize && passenger.partySize > 1
      ? t('rides.party', { count: passenger.partySize })
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Screen
      footerDivider
      footer={
        <Button
          variant="outlineStrong"
          label={t('rides.found')}
          icon={<Icon as={Check} />}
          onPress={onFound}
        />
      }>
      <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: spacing.md }}>
        <Badge
          tone="accent"
          label={contextLabel}
          singleLine
          style={{ flexShrink: 1, alignSelf: 'stretch', justifyContent: 'center' }}
        />
        <Button
          variant="outline"
          label={t('rides.edit')}
          accessibilityHint={t('rides.editHint')}
          onPress={onEdit}
          style={{ borderRadius: radius.pill }}
        />
      </View>

      <View style={{ gap: spacing.xs }}>
        <AppText variant="bodyStrong" color="textMuted">
          {greeting}
        </AppText>
        <AppText variant="display" accessibilityRole="header">
          {passenger.zone}
        </AppText>
        <AppText variant="bodyStrong" color="textMuted">
          {nearby > 0 ? t('rides.nearbySeats', { count: nearby }) : t('rides.nearbySeatsNone')}
        </AppText>
      </View>

      <SegmentedControl
        value={direction}
        onChange={setDirection}
        options={DIRECTIONS.map((value) => ({
          value,
          label: t(`rides.tabs.${value}`, { count: nearbyFreeSeats(matches, value) }),
        }))}
      />

      <View style={{ gap: spacing.md }}>
        {visible.length > 0 ? (
          visible.map((match) => (
            <DriverCard
              key={match.offer.id}
              name={`${match.offer.driver.firstName} ${match.offer.driver.lastName}`}
              details={describeDeparture(match, t, language)}
              seats={match.offer.seats}
              onPress={() => onOpenRide(match.offer)}
            />
          ))
        ) : (
          <AppText color="textMuted">{t('rides.empty')}</AppText>
        )}
      </View>
    </Screen>
  );
}
