import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { SeatIcon } from '@/components/ui/SeatIcon';
import { useTheme } from '@/lib/design/use-theme';
import { seatSlots, type SeatSlot } from '@/lib/rides/bookings';
import type { Booking } from '@/lib/rides/types';

type CarSeatsProps = {
  bookings: Booking[];
  total: number;
};

/** Sièges de sa voiture, chacun avec qui l'occupe (« Esther », « Esther +1 ») ou « Libre ». */
export function CarSeats({ bookings, total }: CarSeatsProps) {
  const { t } = useTranslation();
  const { spacing } = useTheme();

  const labelOf = (slot: SeatSlot) => {
    if (slot.kind === 'free') return t('myCar.seat.free');
    if (!slot.name) return t('myCar.seat.taken');
    return slot.extra === 0
      ? slot.name
      : t('myCar.seat.extra', { name: slot.name, count: slot.extra });
  };

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg }}>
      {seatSlots(bookings, total).map((slot, index) => (
        <View key={index} style={{ alignItems: 'center', gap: spacing.xs }}>
          <SeatIcon free={slot.kind === 'free'} large />
          <AppText variant="label" color={slot.kind === 'free' ? 'seatFreeText' : 'text'}>
            {labelOf(slot)}
          </AppText>
        </View>
      ))}
    </View>
  );
}
