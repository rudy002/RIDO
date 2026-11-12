import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Screen } from '@/components/ui/Screen';

type EventNotFoundProps = {
  /** L'événement est peut-être encore en route depuis le serveur : on patiente avant de conclure. */
  loading?: boolean;
};

/** Lien vers un événement inconnu (supprimé, mal copié…), ou attente de ses données. */
export function EventNotFound({ loading = false }: EventNotFoundProps) {
  const { t } = useTranslation();
  const router = useRouter();

  if (loading) return <LoadingScreen label={t('common.loading')} />;

  return (
    <Screen footer={<Button label={t('notFound.back')} onPress={() => router.replace('/')} />}>
      <AppText variant="title" accessibilityRole="header">
        {t('event.notFoundTitle')}
      </AppText>
      <AppText color="textMuted">{t('event.notFound')}</AppText>
    </Screen>
  );
}
