import type { ReactNode } from 'react';
import { Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

export type ButtonVariant =
  | 'primary'
  | 'primarySmall'
  | 'inverse'
  | 'inverseLarge'
  | 'outline'
  | 'outlineStrong'
  | 'outlineSmall';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Icône affichée avant le libellé (côté « start », donc à droite en RTL). */
  icon?: ReactNode;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const PRESSED_OPACITY = 0.85;
const DISABLED_OPACITY = 0.5;

const VARIANT_STYLE = {
  primary: 'buttonPrimary',
  primarySmall: 'buttonPrimarySmall',
  inverse: 'buttonInverse',
  inverseLarge: 'buttonInverseLarge',
  outline: 'buttonOutline',
  outlineStrong: 'buttonOutlineStrong',
  outlineSmall: 'buttonOutlineSmall',
} as const;

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  icon,
  accessibilityHint,
  style,
  testID,
}: ButtonProps) {
  const { components, spacing } = useTheme();
  const { container, text } = components[VARIANT_STYLE[variant]];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        container,
        { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xl },
        pressed && { opacity: PRESSED_OPACITY },
        disabled && { opacity: DISABLED_OPACITY },
        style,
      ]}>
      {icon}
      <Text style={[text, { textAlign: 'center' }]}>{label}</Text>
    </Pressable>
  );
}
