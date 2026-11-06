import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';
import { SeatIcon } from './SeatIcon';

type SeatRowProps = {
  /** Places passagers de la voiture. */
  total: number;
  free: number;
};

/** Sièges pris puis libres, suivis de « 3 libres » / « 1 libre » / « Complet ». */
export function SeatRow({ total, free }: SeatRowProps) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const freeSeats = Math.min(Math.max(free, 0), total);
  const taken = total - freeSeats;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      {Array.from({ length: total }, (_, index) => (
        <SeatIcon key={index} free={index >= taken} />
      ))}
      <AppText
        variant="heading"
        color={freeSeats > 0 ? 'seatFreeText' : 'textMuted'}
        style={{ marginStart: spacing.sm }}>
        {freeSeats > 0 ? t('seats.free', { count: freeSeats }) : t('seats.full')}
      </AppText>
    </View>
  );
}
