import type { LucideIcon } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { Icon } from './Icon';

type IconButtonProps = {
  icon: LucideIcon;
  /** Lu par le lecteur d'écran (« Retour », « Fermer »). */
  label: string;
  onPress: () => void;
  /** Pour les icônes directionnelles (chevron retour) : inversée en RTL. */
  flipInRTL?: boolean;
};

const PRESSED_OPACITY = 0.85;

/** Bouton rond avec une icône seule (retour, fermer). */
export function IconButton({ icon, label, onPress, flipInRTL = false }: IconButtonProps) {
  const { colors, sizes, radius } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: sizes.touchMin,
          height: sizes.touchMin,
          borderRadius: radius.pill,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        pressed && { opacity: PRESSED_OPACITY },
      ]}>
      <Icon as={icon} flipInRTL={flipInRTL} />
    </Pressable>
  );
}
