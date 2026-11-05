import { ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

type StepHeaderProps = {
  current: number;
  total: number;
  onBack: () => void;
};

const PRESSED_OPACITY = 0.85;

/** En-tête d'un parcours en plusieurs étapes : bouton retour et « Étape 1 sur 2 ». */
export function StepHeader({ current, total, onBack }: StepHeaderProps) {
  const { t } = useTranslation();
  const { colors, sizes, radius } = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        onPress={onBack}
        style={({ pressed }) => [
          {
            width: sizes.touchMin,
            height: sizes.touchMin,
            borderRadius: radius.pill,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          },
          pressed && { opacity: PRESSED_OPACITY },
        ]}>
        <Icon as={ChevronLeft} flipInRTL />
      </Pressable>
      <AppText variant="label" color="textMuted" style={{ flex: 1, textAlign: 'center' }}>
        {t('common.step', { current, total })}
      </AppText>
      {/* Contrepoids du bouton retour pour centrer le libellé. */}
      <View style={{ width: sizes.touchMin }} />
    </View>
  );
}
