import { Pressable, View } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';
import { Switch } from './Switch';

type SwitchRowProps = {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

/** Ligne de réglage : titre, sous-titre et interrupteur ; toute la ligne bascule. */
export function SwitchRow({ title, subtitle, value, onValueChange }: SwitchRowProps) {
  const { colors, spacing, radius, sizes } = useTheme();

  return (
    <Pressable
      // Le lecteur d'écran passe par l'interrupteur, qui porte le libellé.
      accessible={false}
      onPress={() => onValueChange(!value)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
        minHeight: sizes.buttonPrimary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
      }}>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong">{title}</AppText>
        {subtitle ? <AppText color="textMuted">{subtitle}</AppText> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        label={subtitle ? `${title}, ${subtitle}` : title}
      />
    </Pressable>
  );
}
