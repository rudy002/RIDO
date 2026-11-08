import { ChevronDown } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/lib/design/use-theme';

type EventSwitcherProps = {
  /** « Mes événements » (coupé si la place manque). */
  label: string;
  /** Nombre d'événements, toujours visible ; absent s'il n'y en a qu'un. */
  count?: number;
  onPress: () => void;
};

const PRESSED_OPACITY = 0.85;

/** Pilule pour passer d'un de ses événements à l'autre. */
export function EventSwitcher({ label, count, onPress }: EventSwitcherProps) {
  const { colors, spacing, sizes, radius } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={count ? `${label} · ${count}` : label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flex: 1,
          height: sizes.touchMin,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          borderRadius: radius.pill,
          backgroundColor: colors.surface,
        },
        pressed && { opacity: PRESSED_OPACITY },
      ]}>
      <AppText variant="label" numberOfLines={1} style={{ flexShrink: 1 }}>
        {label}
      </AppText>
      {count ? <AppText variant="label">{`· ${count}`}</AppText> : null}
      <View style={{ flex: 1 }} />
      <Icon as={ChevronDown} />
    </Pressable>
  );
}
