import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { BaseText } from './BaseText';

type ToggleButtonProps = {
  label: string;
  selected: boolean;
  onToggle: () => void;
  style?: StyleProp<ViewStyle>;
};

const PRESSED_OPACITY = 0.85;

/** Bouton à cocher indépendamment des autres (Aller / Retour) : plein quand il est actif. */
export function ToggleButton({ label, selected, onToggle, style }: ToggleButtonProps) {
  const { components, spacing } = useTheme();
  const { container, text } = selected ? components.buttonInverse : components.buttonOutline;

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onToggle}
      style={({ pressed }) => [
        container,
        { paddingHorizontal: spacing.md },
        pressed && { opacity: PRESSED_OPACITY },
        style,
      ]}>
      <BaseText style={text} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </BaseText>
    </Pressable>
  );
}
