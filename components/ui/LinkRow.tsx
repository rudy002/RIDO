import { ChevronRight } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

type LinkRowProps = {
  label: string;
  onPress: () => void;
};

const PRESSED_OPACITY = 0.85;

/** Ligne à contour qui mène vers une autre liste (« 3 trajets passés »). */
export function LinkRow({ label, onPress }: LinkRowProps) {
  const { colors, spacing, sizes, radius } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: sizes.input,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingHorizontal: spacing.lg,
          borderRadius: radius.lg,
          borderWidth: sizes.borderStrong,
          borderColor: colors.border,
        },
        pressed && { opacity: PRESSED_OPACITY },
      ]}>
      <AppText variant="bodyStrong" style={{ flex: 1 }}>
        {label}
      </AppText>
      <Icon as={ChevronRight} flipInRTL />
    </Pressable>
  );
}
