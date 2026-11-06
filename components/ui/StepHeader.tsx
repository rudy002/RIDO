import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';
import { BackButton } from './BackButton';

type StepHeaderProps = {
  current: number;
  total: number;
  onBack: () => void;
};

/** En-tête d'un parcours en plusieurs étapes : bouton retour et « Étape 1 sur 2 ». */
export function StepHeader({ current, total, onBack }: StepHeaderProps) {
  const { t } = useTranslation();
  const { sizes } = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <BackButton onPress={onBack} />
      <AppText variant="label" color="textMuted" style={{ flex: 1, textAlign: 'center' }}>
        {t('common.step', { current, total })}
      </AppText>
      {/* Contrepoids du bouton retour pour centrer le libellé. */}
      <View style={{ width: sizes.touchMin }} />
    </View>
  );
}
