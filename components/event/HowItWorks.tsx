import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { NumberedStep } from '@/components/ui/NumberedStep';
import { useTheme } from '@/lib/design/use-theme';

const STEPS = ['invitation.step1', 'invitation.step2', 'invitation.step3'] as const;

/** Section « Comment ça marche » de l'invitation. */
export function HowItWorks() {
  const { t } = useTranslation();
  const { spacing } = useTheme();

  return (
    <View style={{ gap: spacing.lg }}>
      <AppText variant="heading" accessibilityRole="header">
        {t('invitation.howItWorks')}
      </AppText>
      <View style={{ gap: spacing.lg }}>
        {STEPS.map((key, index) => (
          <NumberedStep key={key} number={index + 1} text={t(key)} />
        ))}
      </View>
    </View>
  );
}
