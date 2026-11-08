import { Minus, Plus, type LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

type StepperProps = {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  /** Valeur lue par le lecteur d'écran (« 3 places libres »). */
  valueLabel: string;
  decreaseLabel: string;
  increaseLabel: string;
  /** Grand (carte « Ta voiture ») ou compact (ligne d'un formulaire). */
  size?: 'large' | 'compact';
};

const PRESSED_OPACITY = 0.85;
const DISABLED_OPACITY = 0.4;

/** Nombre réglable avec − et + (places libres…). */
export function Stepper({
  value,
  min,
  max,
  onChange,
  valueLabel,
  decreaseLabel,
  increaseLabel,
  size = 'large',
}: StepperProps) {
  const { components, spacing } = useTheme();
  const { button, buttonFilled, buttonCompact } = components.stepper;
  const compact = size === 'compact';

  const control = (icon: LucideIcon, label: string, next: number, filled: boolean) => {
    const disabled = next < min || next > max;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => onChange(next)}
        style={({ pressed }) => [
          button,
          compact && buttonCompact,
          filled && buttonFilled,
          pressed && { opacity: PRESSED_OPACITY },
          disabled && { opacity: DISABLED_OPACITY },
        ]}>
        <Icon as={icon} color={filled ? 'onInverse' : 'text'} />
      </Pressable>
    );
  };

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={valueLabel}
      accessibilityValue={{ min, max, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={({ nativeEvent }) => {
        const next = nativeEvent.actionName === 'increment' ? value + 1 : value - 1;
        if (next >= min && next <= max) onChange(next);
      }}
      style={
        compact
          ? { flexDirection: 'row', alignItems: 'center', gap: spacing.lg }
          : { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }
      }>
      {control(Minus, decreaseLabel, value - 1, false)}
      <AppText variant={compact ? 'title' : 'counter'}>{value}</AppText>
      {control(Plus, increaseLabel, value + 1, true)}
    </View>
  );
}
