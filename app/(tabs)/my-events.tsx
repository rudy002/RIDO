import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';

/** A2 : « Mes événements » (maquette à venir). */
export default function MyEventsRoute() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('tabs.events')} />;
}
