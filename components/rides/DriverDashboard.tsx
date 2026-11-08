import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { LinkButton } from '@/components/ui/LinkButton';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useTheme } from '@/lib/design/use-theme';
import { elisionContext } from '@/lib/i18n/elision';
import { formatTime } from '@/lib/i18n/format';
import { bookedSeats, freeSeats, releaseSeat, takeSeat } from '@/lib/rides/bookings';
import {
  TRIP_DIRECTIONS,
  type Booking,
  type DriverLeg,
  type RideRequest,
  type TripDirection,
} from '@/lib/rides/types';

import { CarSeats } from './CarSeats';
import { ContextHeader } from './ContextHeader';
import { PassengerCard } from './PassengerCard';

type DriverDashboardProps = {
  /** Pastille du contexte : « Mariage de Léa et Samuel · 14 juin ». */
  contextLabel: string;
  driver: { firstName: string; zone: string };
  /** Les trajets publiés, un par sens. */
  legs: Partial<Record<TripDirection, DriverLeg>>;
  /** Passagers de la même zone qui cherchent un trajet. */
  requests: RideRequest[];
  onEdit: () => void;
  onBack: () => void;
  onContact: (request: RideRequest) => void;
  /** Places notées ou libérées par le conducteur, pour un sens. */
  onBookingsChange: (direction: TripDirection, bookings: Booking[]) => void;
  /** Appelé après confirmation : la voiture est retirée. */
  onCancel: () => void;
};

/** Écran C3 : la voiture du conducteur, ses places et les passagers qui cherchent près de lui. */
export function DriverDashboard({
  contextLabel,
  driver,
  legs,
  requests,
  onEdit,
  onBack,
  onContact,
  onBookingsChange,
  onCancel,
}: DriverDashboardProps) {
  const { t } = useTranslation();
  const { spacing, language } = useTheme();
  const directions = TRIP_DIRECTIONS.filter((direction) => legs[direction]);
  const [selected, setDirection] = useState<TripDirection>(directions[0] ?? 'outbound');
  // Le sens choisi peut disparaître (trajet retiré en modifiant la voiture) : on retombe sur un autre.
  const direction = directions.includes(selected) ? selected : (directions[0] ?? 'outbound');
  const [confirming, setConfirming] = useState(false);

  const timeOf = (leg: DriverLeg) => {
    const from = formatTime(leg.departure.from, language);
    return leg.departure.to ? `${from}–${formatTime(leg.departure.to, language)}` : from;
  };

  const leg = legs[direction];
  const legBookings = leg?.bookings ?? [];
  const free = leg ? freeSeats(legBookings, leg.totalSeats) : 0;
  const visibleRequests = requests.filter((request) => request.direction === direction);
  const zoneParams = { zone: driver.zone, context: elisionContext(driver.zone) };

  const update = (change: (current: Booking[]) => Booking[]) =>
    onBookingsChange(direction, change(legBookings));

  return (
    <Screen footer={<LinkButton label={t('myCar.cancel')} onPress={() => setConfirming(true)} />}>
      <ContextHeader label={contextLabel} onEdit={onEdit} onBack={onBack} />

      <View style={{ gap: spacing.xs }}>
        <AppText variant="bodyStrong" color="textMuted">
          {t('rides.greeting', { name: driver.firstName })}
        </AppText>
        <AppText variant="title" accessibilityRole="header">
          {t('car.title')}
        </AppText>
      </View>

      {directions.length > 1 ? (
        <SegmentedControl
          value={direction}
          onChange={setDirection}
          options={directions.map((value) => {
            const item = legs[value];
            return {
              value,
              label: t(`myCar.tabs.${value}`, { time: item ? timeOf(item) : '' }),
            };
          })}
        />
      ) : null}

      {leg ? (
        <Card style={{ gap: spacing.lg }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: spacing.md,
            }}>
            <AppText variant="heading" style={{ flexShrink: 1 }}>
              {direction === 'outbound'
                ? t('myCar.leavingFrom', zoneParams)
                : t('myCar.headingBackTo', zoneParams)}
            </AppText>
            <AppText variant="heading" color={free > 0 ? 'seatFreeText' : 'textMuted'}>
              {free > 0 ? t('myCar.free', { count: free }) : t('seats.full')}
            </AppText>
          </View>
          <CarSeats bookings={legBookings} total={leg.totalSeats} />
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Button
              variant="inverse"
              style={{ flex: 1, paddingHorizontal: spacing.md }}
              label={t('myCar.take')}
              disabled={free === 0}
              onPress={() => update((current) => takeSeat(current, leg.totalSeats))}
            />
            <Button
              variant="outline"
              style={{ flex: 1, paddingHorizontal: spacing.md }}
              label={t('myCar.release')}
              disabled={bookedSeats(legBookings) === 0}
              onPress={() => update(releaseSeat)}
            />
          </View>
        </Card>
      ) : null}

      <View style={{ gap: spacing.md }}>
        <AppText variant="heading">
          {direction === 'outbound'
            ? t('myCar.requests.outbound', zoneParams)
            : t('myCar.requests.return', zoneParams)}
        </AppText>
        {visibleRequests.length > 0 ? (
          visibleRequests.map((request) => (
            <PassengerCard
              key={request.id}
              request={request}
              onContact={() => onContact(request)}
            />
          ))
        ) : (
          <AppText color="textMuted">{t('myCar.requests.empty', zoneParams)}</AppText>
        )}
      </View>
      <ConfirmSheet
        visible={confirming}
        title={t('myCar.cancelConfirm.title')}
        message={t('myCar.cancelConfirm.message')}
        confirmLabel={t('myCar.cancelConfirm.confirm')}
        cancelLabel={t('myCar.cancelConfirm.keep')}
        onConfirm={() => {
          setConfirming(false);
          onCancel();
        }}
        onCancel={() => setConfirming(false)}
      />
    </Screen>
  );
}
