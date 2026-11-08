import { Check } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { LinkButton } from '@/components/ui/LinkButton';
import { OptionSheet } from '@/components/ui/OptionSheet';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useTheme } from '@/lib/design/use-theme';
import { formatShortName, formatTime } from '@/lib/i18n/format';
import type { Language } from '@/lib/i18n';
import type { RideMatch, RideOffer, TripDirection } from '@/lib/rides/types';
import type { TFunction } from 'i18next';

import { ContextHeader } from './ContextHeader';
import { DriverCard } from './DriverCard';

/** Où en est le passager pour un trajet : place trouvée (avec qui) ou encore en recherche. */
export type PassengerLegStatus = {
  found: boolean;
  driver?: { firstName: string; lastName: string };
};

type DriverListProps = {
  /** Pastille du contexte : « Mariage de Léa et Samuel · 14 juin ». */
  contextLabel: string;
  passenger: { firstName: string; zone: string; partySize?: number };
  matches: RideMatch[];
  /** Trajets de l'inscription (l'aller, le retour ou les deux). */
  directions: TripDirection[];
  status: Partial<Record<TripDirection, PassengerLegStatus>>;
  initialDirection?: TripDirection;
  onEdit: () => void;
  onBack: () => void;
  onOpenRide: (offer: RideOffer) => void;
  /** Place trouvée dans la voiture d'un conducteur de la liste, ou autrement (`null`). */
  onFound: (direction: TripDirection, offerId: string | null) => void;
  onSearchAgain: (direction: TripDirection) => void;
};

const ELSEWHERE = 'elsewhere';

/** Places libres chez les conducteurs de la même ville (« près de chez toi »). */
function nearbyFreeSeats(matches: RideMatch[], direction: TripDirection): number {
  return matches
    .filter(({ offer, sameCity }) => offer.direction === direction && sameCity)
    .reduce((sum, { offer }) => sum + Math.max(offer.seats.free, 0), 0);
}

/** « Part entre 18h00 et 18h30 · Centre » ou « Gan Yavne, à 5 km · vers 18h00 ». */
function describeDeparture(match: RideMatch, t: TFunction, language: Language): string {
  const { home, departure } = match.offer;
  const from = formatTime(departure.from, language);
  const to = departure.to ? formatTime(departure.to, language) : undefined;

  if (!match.sameCity) {
    const when = to
      ? t('rides.departure.windowShort', { from, to })
      : t('rides.departure.aroundShort', { time: from });
    const where =
      match.distanceKm !== undefined
        ? t('rides.departure.nearby', { city: home.city, distance: match.distanceKm })
        : home.city;
    return `${where} · ${when}`;
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
  directions,
  status,
  initialDirection,
  onEdit,
  onBack,
  onOpenRide,
  onFound,
  onSearchAgain,
}: DriverListProps) {
  const { t } = useTranslation();
  const { spacing, language } = useTheme();
  const [direction, setDirection] = useState<TripDirection>(
    initialDirection && directions.includes(initialDirection)
      ? initialDirection
      : (directions[0] ?? 'outbound')
  );
  const [choosing, setChoosing] = useState(false);
  const current = status[direction];
  const partySize = passenger.partySize ?? 1;

  const visible = useMemo(
    () =>
      matches
        .filter(({ offer }) => offer.direction === direction)
        // Les voitures complètes passent en dernier.
        .sort((a, b) => Number(a.offer.seats.free <= 0) - Number(b.offer.seats.free <= 0)),
    [matches, direction]
  );
  // On ne peut partir qu'avec un conducteur qui a encore assez de places pour tout le groupe.
  const choices = visible.filter(({ offer }) => offer.seats.free >= partySize);

  const nearby = nearbyFreeSeats(matches, direction);
  const greeting = [
    t('rides.greeting', { name: passenger.firstName }),
    partySize > 1 ? t('rides.party', { count: partySize }) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const footer = current?.found ? (
    <>
      <Card tone="success" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Icon as={Check} color="successText" />
        <AppText variant="label" color="successText" style={{ flex: 1 }}>
          {current.driver
            ? t('rides.foundWith', {
                name: formatShortName(current.driver.firstName, current.driver.lastName, language),
              })
            : t('rides.foundElsewhere')}
        </AppText>
      </Card>
      <LinkButton label={t('rides.searchAgain')} onPress={() => onSearchAgain(direction)} />
    </>
  ) : (
    <Button
      variant="outlineStrong"
      label={t('rides.found')}
      icon={<Icon as={Check} />}
      onPress={() => setChoosing(true)}
    />
  );

  return (
    <Screen footerDivider footer={footer}>
      <ContextHeader label={contextLabel} onEdit={onEdit} onBack={onBack} />

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

      {directions.length > 1 ? (
        <SegmentedControl
          value={direction}
          onChange={setDirection}
          options={directions.map((value) => ({
            value,
            label: t(`rides.tabs.${value}`, { count: nearbyFreeSeats(matches, value) }),
          }))}
        />
      ) : null}

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

      <OptionSheet
        visible={choosing}
        title={t('rides.foundSheet.title')}
        value=""
        options={[
          ...choices.map(({ offer }) => ({
            value: offer.id,
            label: t('rides.foundSheet.withDriver', {
              name: `${offer.driver.firstName} ${offer.driver.lastName}`,
            }),
          })),
          { value: ELSEWHERE, label: t('rides.foundSheet.elsewhere') },
        ]}
        onSelect={(value) => {
          setChoosing(false);
          onFound(direction, value === ELSEWHERE ? null : value);
        }}
        onClose={() => setChoosing(false)}
      />
    </Screen>
  );
}
