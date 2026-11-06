import { Pressable } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';

type LinkButtonProps = {
  label: string;
  onPress: () => void;
};

const PRESSED_OPACITY = 0.6;

/** Action discrète en texte souligné (« Je ne peux plus conduire »). */
export function LinkButton({ label, onPress }: LinkButtonProps) {
  const { sizes, spacing } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: sizes.touchMin,
          alignSelf: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.lg,
        },
        pressed && { opacity: PRESSED_OPACITY },
      ]}>
      <AppText variant="label" color="textMuted" style={{ textDecorationLine: 'underline' }}>
        {label}
      </AppText>
    </Pressable>
  );
}
