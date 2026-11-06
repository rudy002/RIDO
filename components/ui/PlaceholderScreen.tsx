import { useTranslation } from 'react-i18next';

import { AppText } from './AppText';
import { Screen } from './Screen';

type PlaceholderScreenProps = {
  title: string;
};

/** Onglet dont l'écran n'est pas encore construit : son titre et « bientôt ». */
export function PlaceholderScreen({ title }: PlaceholderScreenProps) {
  const { t } = useTranslation();
  return (
    <Screen aboveTabBar>
      <AppText variant="display" accessibilityRole="header">
        {title}
      </AppText>
      <AppText color="textMuted">{t('common.comingSoon')}</AppText>
    </Screen>
  );
}
