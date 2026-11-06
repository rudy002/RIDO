import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

export type CardTone = 'surface' | 'muted' | 'inverse' | 'success' | 'danger';

type CardProps = Pick<ViewProps, 'accessible' | 'accessibilityLabel' | 'testID'> & {
  children: ReactNode;
  tone?: CardTone;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, tone = 'surface', style, ...props }: CardProps) {
  const { components, colors } = useTheme();

  const background = {
    surface: colors.surface,
    muted: colors.surfaceMuted,
    inverse: colors.inverse,
    success: colors.seatFree,
    danger: colors.dangerSoft,
  }[tone];

  return (
    <View {...props} style={[components.card, { backgroundColor: background }, style]}>
      {children}
    </View>
  );
}
