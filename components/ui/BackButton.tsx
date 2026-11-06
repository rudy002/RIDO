import { ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { Icon } from './Icon';

type BackButtonProps = {
  onPress: () => void;
};

const PRESSED_OPACITY = 0.85;

/** Bouton retour rond (chevron inversé en RTL). */
export function BackButton({ onPress }: BackButtonProps) {
  const { t } = useTranslation();
  const { colors, sizes, radius } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('common.back')}
      onPress={onPress}
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
  );
}
