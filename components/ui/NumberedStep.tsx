import { View } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';

type NumberedStepProps = {
  number: number;
  text: string;
};

/** Étape numérotée : rond avec le numéro, puis le texte. */
export function NumberedStep({ number, text }: NumberedStepProps) {
  const { colors, radius, sizes, spacing } = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
      <View
        style={{
          width: sizes.stepBadge,
          height: sizes.stepBadge,
          borderRadius: radius.pill,
          backgroundColor: colors.accentSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <AppText variant="heading" color="onAccentSoft">
          {number}
        </AppText>
      </View>
      <AppText style={{ flex: 1 }}>{text}</AppText>
    </View>
  );
}
