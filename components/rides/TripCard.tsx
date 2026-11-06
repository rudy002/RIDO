import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { SeatIcon } from '@/components/ui/SeatIcon';
import { useTheme } from '@/lib/design/use-theme';
import { formatDeparture, formatShortName, formatShortWeekdayDate } from '@/lib/i18n/format';
import { freeSeats, seatSlots } from '@/lib/rides/bookings';
import { TRIP_DIRECTIONS, type DriverLeg, type TripDirection } from '@/lib/rides/types';
import type { PassengerLeg, Trip } from '@/lib/trips/types';

type TripCardProps = {
  trip: Trip;
  onPress: () => void;
};

const PRESSED_OPACITY = 0.85;

/** Un trajet à venir : contexte, rôle, puis l'aller et le retour. */
export function TripCard({ trip, onPress }: TripCardProps) {
  const { t } = useTranslation();
  const { components, colors, spacing, sizes, language } = useTheme();
  const { context, role } = trip;
  const directions = TRIP_DIRECTIONS.filter((direction) => trip.legs[direction]);

  const legTitle = (direction: TripDirection, leg: { departure?: DriverLeg['departure'] }) =>
    leg.departure
      ? `${t(`rideDetails.directions.${direction}`)} · ${formatDeparture(leg.departure.from, leg.departure.to, language)}`
      : t(`rideDetails.directions.${direction}`);

  const driverRow = (direction: TripDirection, leg: DriverLeg, showSeats: boolean) => {
    const free = freeSeats(leg.bookings, leg.totalSeats);
    return (
      <View key={direction} style={row}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <AppText variant="label" color="textMuted">
            {legTitle(direction, leg)}
          </AppText>
          {showSeats ? (
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {seatSlots(leg.bookings, leg.totalSeats).map((slot, index) => (
                <SeatIcon key={index} free={slot.kind === 'free'} small />
              ))}
            </View>
          ) : null}
        </View>
        <AppText variant="bodyStrong" color={free > 0 ? 'seatFreeText' : 'textMuted'}>
          {free > 0 ? t('seats.free', { count: free }) : t('seats.full')}
        </AppText>
      </View>
    );
  };

  const passengerRow = (direction: TripDirection, leg: PassengerLeg) => (
    <View key={direction} style={row}>
      <AppText variant="label" color="textMuted" style={{ flex: 1 }}>
        {legTitle(direction, leg)}
      </AppText>
      {leg.driver ? (
        <AppText variant="bodyStrong">
          {t('trips.with', { name: formatShortName(leg.driver.firstName, leg.driver.lastName) })}
        </AppText>
      ) : (
        <Badge small tone="danger" label={t('trips.stillLooking')} />
      )}
    </View>
  );

  const row = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.md,
  };
  const roleLabel = t(`trips.roles.${role}`);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${context.title}, ${roleLabel}`}
      onPress={onPress}
      style={({ pressed }) => [
        components.card,
        { gap: spacing.md },
        pressed && { opacity: PRESSED_OPACITY },
      ]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <AppText variant="label" color="textMuted" style={{ flex: 1 }}>
          {`${t(`event.types.${context.kind}`)} · ${formatShortWeekdayDate(context.startsAt, language)}`}
        </AppText>
        <Badge small tone={role === 'driver' ? 'success' : 'accent'} label={roleLabel} />
      </View>
      <AppText variant="heading">{context.title}</AppText>
      <View style={{ height: sizes.borderHairline, backgroundColor: colors.divider }} />
      <View style={{ gap: spacing.sm }}>
        {trip.role === 'driver'
          ? directions.map((direction, index) => {
              const leg = trip.legs[direction];
              // Comme sur la maquette : les sièges du premier trajet seulement, pour rester compact.
              return leg ? driverRow(direction, leg, index === 0) : null;
            })
          : directions.map((direction) => {
              const leg = trip.legs[direction];
              return leg ? passengerRow(direction, leg) : null;
            })}
      </View>
    </Pressable>
  );
}
