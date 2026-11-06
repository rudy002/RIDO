import { ChevronDown } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/lib/design/use-theme';

type EventSwitcherProps = {
  /** « Mes événements · 2 ». */
  label: string;
  onPress: () => void;
};

const PRESSED_OPACITY = 0.85;

/** Pilule pour passer d'un de ses événements à l'autre. */
export function EventSwitcher({ label, onPress }: EventSwitcherProps) {
  const { colors, spacing, sizes, radius } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
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
      <AppText variant="label" numberOfLines={1} style={{ flex: 1 }}>
        {label}
      </AppText>
      <Icon as={ChevronDown} />
    </Pressable>
  );
}
