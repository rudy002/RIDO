import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

type InfoNoteProps = {
  icon: LucideIcon;
  text: string;
};

/** Encadré d'aide discret, avec une icône. */
export function InfoNote({ icon, text }: InfoNoteProps) {
  const { colors, spacing, radius, sizes } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.lg,
        backgroundColor: colors.segment,
      }}>
      <Icon as={icon} size={sizes.noteIcon} />
      <AppText style={{ flex: 1 }}>{text}</AppText>
    </View>
  );
}
