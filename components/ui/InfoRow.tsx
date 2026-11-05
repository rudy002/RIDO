import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import type { Colors } from '@/lib/design/tokens';
import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

type InfoRowProps = {
  icon: LucideIcon;
  text: string;
  color?: keyof Colors;
};

/** Ligne icône + texte (date, lieu…). */
export function InfoRow({ icon, text, color = 'text' }: InfoRowProps) {
  const { spacing } = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <Icon as={icon} color={color} />
      <AppText variant="bodyStrong" color={color} style={{ flexShrink: 1 }}>
        {text}
      </AppText>
    </View>
  );
}
