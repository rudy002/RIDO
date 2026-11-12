import type { ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { BaseText } from './BaseText';

export type ButtonVariant =
  | 'primary'
  | 'primarySmall'
  | 'inverse'
  | 'inverseLarge'
  | 'outline'
  | 'outlineStrong'
  | 'outlineSmall'
  | 'danger';

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
  danger: 'buttonDanger',
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
      {/*
        Un libellé de bouton tient sur une ligne. Sans cette limite, Android redessine parfois le
        texte avec une largeur périmée quand l'écran se réaffiche : le dernier mot passait à la
        ligne, caché par la hauteur du bouton (« J'ai trouvé ma »).
      */}
      <BaseText style={[text, { textAlign: 'center' }]} numberOfLines={1}>
        {label}
      </BaseText>
    </Pressable>
  );
}
