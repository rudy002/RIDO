import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';

/** A3 : « Profil » (maquette à venir). */
export default function ProfileRoute() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('tabs.profile')} />;
}
