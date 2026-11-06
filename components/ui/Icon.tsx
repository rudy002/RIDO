import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import type { Colors } from '@/lib/design/tokens';
import { useTheme } from '@/lib/design/use-theme';

type IconProps = {
  as: LucideIcon;
  color?: keyof Colors;
  size?: number;
  /** À activer pour les icônes directionnelles (retour, chevrons, flèches) : inversées en RTL. */
  flipInRTL?: boolean;
  /** Épaisseur du trait (plus épais pour un onglet actif). */
  strokeWidth?: number;
};

/** Icône Lucide décorative, colorée avec les tokens. */
export function Icon({
  as: LucideComponent,
  color = 'text',
  size,
  flipInRTL = false,
  strokeWidth,
}: IconProps) {
  const { colors, sizes, isRTL } = useTheme();

  // Les propriétés d'accessibilité vont sur une View : posées sur le SVG, le web les rejette.
  return (
    <View
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={flipInRTL && isRTL ? { transform: [{ scaleX: -1 }] } : undefined}>
      <LucideComponent color={colors[color]} size={size ?? sizes.icon} strokeWidth={strokeWidth} />
    </View>
  );
}
