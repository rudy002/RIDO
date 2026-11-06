import { ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { IconButton } from './IconButton';

type BackButtonProps = {
  onPress: () => void;
};

/** Bouton retour rond (chevron inversé en RTL). */
export function BackButton({ onPress }: BackButtonProps) {
  const { t } = useTranslation();
  return <IconButton icon={ChevronLeft} label={t('common.back')} onPress={onPress} flipInRTL />;
}
