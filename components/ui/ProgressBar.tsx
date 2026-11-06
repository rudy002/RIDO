import { View } from 'react-native';

import type { Colors } from '@/lib/design/tokens';
import { useTheme } from '@/lib/design/use-theme';

type ProgressBarProps = {
  /** De 0 à 1. */
  ratio: number;
  color: keyof Colors;
};

/** Barre de remplissage arrondie, décorative : la valeur est toujours écrite à côté. */
export function ProgressBar({ ratio, color }: ProgressBarProps) {
  const { colors, sizes, radius } = useTheme();
  const clamped = Math.min(Math.max(ratio, 0), 1);

  return (
    <View
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        height: sizes.progressBar,
        borderRadius: radius.pill,
        backgroundColor: colors.segment,
        overflow: 'hidden',
      }}>
      <View
        style={{
          width: `${clamped * 100}%`,
          // Même vide, un point reste visible pour signaler la zone.
          minWidth: sizes.progressBar * 3,
          height: '100%',
          borderRadius: radius.pill,
          backgroundColor: colors[color],
        }}
      />
    </View>
  );
}
