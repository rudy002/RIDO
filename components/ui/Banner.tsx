import { X, type LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

type BannerProps = {
  icon: LucideIcon;
  text: string;
  /** Lu par le lecteur d'écran sur le bouton de fermeture (« Fermer »). */
  dismissLabel: string;
  onDismiss: () => void;
};

/** Message important posé au-dessus de l'écran (refus du serveur…), à fermer d'un geste. */
export function Banner({ icon, text, dismissLabel, onDismiss }: BannerProps) {
  const { colors, spacing, radius, sizes } = useTheme();

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingStart: spacing.lg,
        paddingVertical: spacing.xs,
        borderRadius: radius.lg,
        backgroundColor: colors.dangerSoft,
      }}>
      <Icon as={icon} size={sizes.noteIcon} color="dangerText" />
      <AppText color="dangerText" style={{ flex: 1, paddingVertical: spacing.sm }}>
        {text}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={dismissLabel}
        onPress={onDismiss}
        style={{
          width: sizes.touchMin,
          height: sizes.touchMin,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Icon as={X} color="dangerText" />
      </Pressable>
    </View>
  );
}
