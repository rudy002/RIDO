import { ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { SeatRow } from '@/components/ui/SeatRow';
import { useTheme } from '@/lib/design/use-theme';

type DriverCardProps = {
  name: string;
  /** Départ déjà mis en forme : « Part entre 18h00 et 18h30 · Centre ». */
  details: string;
  seats: { total: number; free: number };
  onPress: () => void;
};

const PRESSED_OPACITY = 0.85;

/** Conducteur dans une liste : qui, d'où et quand, places libres ; ouvre la fiche trajet. */
export function DriverCard({ name, details, seats, onPress }: DriverCardProps) {
  const { t } = useTranslation();
  const { components, spacing } = useTheme();
  const full = seats.free <= 0;
  const seatsLabel = full ? t('seats.full') : t('seats.free', { count: seats.free });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${details}, ${seatsLabel}`}
      onPress={onPress}
      style={({ pressed }) => [
        full ? components.cardMuted : components.card,
        pressed && { opacity: PRESSED_OPACITY },
      ]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
        <Avatar name={name} muted={full} />
        <View style={{ flex: 1 }}>
          <AppText variant="heading">{name}</AppText>
          <AppText color="textMuted">{details}</AppText>
        </View>
        <Icon as={ChevronRight} flipInRTL />
      </View>
      <SeatRow total={seats.total} free={seats.free} />
    </Pressable>
  );
}
