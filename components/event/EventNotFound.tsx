import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';

/** Lien vers un événement inconnu (supprimé, mal copié, ou créé sur un autre appareil). */
export function EventNotFound() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Screen footer={<Button label={t('notFound.back')} onPress={() => router.replace('/')} />}>
      <AppText variant="title" accessibilityRole="header">
        {t('event.notFoundTitle')}
      </AppText>
      <AppText color="textMuted">{t('event.notFound')}</AppText>
    </Screen>
  );
}
