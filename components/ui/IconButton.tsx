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
  /** Jaune pour l'action principale d'un écran (partager, appeler) ; foncé pour l'action voisine. */
  tone?: 'surface' | 'primary' | 'inverse';
};

const TONES = {
  surface: { background: 'surface', icon: 'text' },
  primary: { background: 'primary', icon: 'onPrimary' },
  inverse: { background: 'inverse', icon: 'onInverse' },
} as const;

const PRESSED_OPACITY = 0.85;

/** Bouton rond avec une icône seule (retour, fermer). */
export function IconButton({
  icon,
  label,
  onPress,
  flipInRTL = false,
  tone = 'surface',
}: IconButtonProps) {
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
          backgroundColor: colors[TONES[tone].background],
          alignItems: 'center',
          justifyContent: 'center',
        },
        pressed && { opacity: PRESSED_OPACITY },
      ]}>
      <Icon as={icon} flipInRTL={flipInRTL} color={TONES[tone].icon} />
    </Pressable>
  );
}
