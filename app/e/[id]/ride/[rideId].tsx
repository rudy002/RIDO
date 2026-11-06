import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';

/** Écran T (fiche trajet) : provisoire, en attendant sa maquette. */
export default function RideDetailsRoute() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen>
        <AppText>{t('rideDetails.comingSoon')}</AppText>
        <Button variant="outline" label={t('common.back')} onPress={() => router.back()} />
      </Screen>
    </>
  );
}
