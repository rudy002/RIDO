import { Check } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

type OptionRowProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

const PRESSED_OPACITY = 0.85;

/** Ligne d'une liste de choix (heure, apparence, langue), cochée si sélectionnée. */
export function OptionRow({ label, selected, onPress }: OptionRowProps) {
  const { colors, spacing, sizes } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        {
          height: sizes.input,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.screen,
          borderBottomWidth: sizes.borderHairline,
          borderBottomColor: colors.divider,
        },
        pressed && { opacity: PRESSED_OPACITY },
      ]}>
      <AppText variant={selected ? 'bodyStrong' : 'body'} style={{ flex: 1 }}>
        {label}
      </AppText>
      {selected ? <Icon as={Check} /> : null}
    </Pressable>
  );
}
