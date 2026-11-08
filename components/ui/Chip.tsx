import { Pressable } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { BaseText } from './BaseText';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

const PRESSED_OPACITY = 0.85;

/** Pastille de choix ; un seul choix actif dans un `ChipGroup`. */
export function Chip({ label, selected, onPress }: ChipProps) {
  const { components, typography, colors, sizes } = useTheme();
  // Pastille visible de 44 px, zone tactile portée à 48.
  const slop = Math.max(0, (sizes.touchMin - components.chip.height) / 2);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, selected }}
      hitSlop={{ top: slop, bottom: slop }}
      onPress={onPress}
      style={({ pressed }) => [
        components.chip,
        selected && components.chipSelected,
        pressed && !selected && { opacity: PRESSED_OPACITY },
      ]}>
      <BaseText style={[typography.label, { color: selected ? colors.onInverse : colors.text }]}>
        {label}
      </BaseText>
    </Pressable>
  );
}
