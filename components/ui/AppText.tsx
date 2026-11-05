import { Text, type TextProps } from 'react-native';

import type { Colors } from '@/lib/design/tokens';
import { useTheme } from '@/lib/design/use-theme';

export type TextVariant = keyof ReturnType<typeof useTheme>['typography'];

type AppTextProps = TextProps & {
  variant?: TextVariant;
  color?: keyof Colors;
};

/** Texte de l'appli : typographie et couleur issues des tokens, police selon la langue. */
export function AppText({ variant = 'body', color = 'text', style, ...props }: AppTextProps) {
  const { typography, colors } = useTheme();
  return <Text {...props} style={[typography[variant], { color: colors[color] }, style]} />;
}
