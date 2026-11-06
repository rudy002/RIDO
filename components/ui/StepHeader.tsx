import { useTranslation } from 'react-i18next';

import { ScreenHeader } from './ScreenHeader';

type StepHeaderProps = {
  current: number;
  total: number;
  onBack: () => void;
};

/** En-tête d'un parcours en plusieurs étapes : bouton retour et « Étape 1 sur 2 ». */
export function StepHeader({ current, total, onBack }: StepHeaderProps) {
  const { t } = useTranslation();
  return (
    <ScreenHeader action="back" onAction={onBack} title={t('common.step', { current, total })} />
  );
}
