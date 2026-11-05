import type { LucideIcon } from 'lucide-react-native';

import type { Colors } from '@/lib/design/tokens';
import { useTheme } from '@/lib/design/use-theme';

type IconProps = {
  as: LucideIcon;
  color?: keyof Colors;
  size?: number;
  /** À activer pour les icônes directionnelles (retour, chevrons, flèches) : inversées en RTL. */
  flipInRTL?: boolean;
};

/** Icône Lucide décorative, colorée avec les tokens. */
export function Icon({ as: LucideComponent, color = 'text', size, flipInRTL = false }: IconProps) {
  const { colors, sizes, isRTL } = useTheme();

  return (
    <LucideComponent
      color={colors[color]}
      size={size ?? sizes.icon}
      style={flipInRTL && isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
