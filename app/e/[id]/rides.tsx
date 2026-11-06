import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { DriverList } from '@/components/rides/DriverList';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/lib/design/use-theme';
import { findMockEvent } from '@/lib/events/mock';
import { formatShortDate } from '@/lib/i18n/format';
import { DEMO_MATCHES, DEMO_PASSENGER } from '@/lib/rides/mock';

// « Mariage d'Esther » : élision devant une voyelle (utilisée en français).
const STARTS_WITH_VOWEL = /^[aeiouyàâäéèêëîïôöùûü]/i;

/** P1 : conducteurs disponibles pour un passager. */
export default function DriverListRoute() {
  const { id, firstName, zone } = useLocalSearchParams<{
    id: string;
    firstName?: string;
    zone?: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = useTheme();
  const event = findMockEvent(id);

  // Pas encore de stockage : les infos viennent de l'étape précédente, sinon de la démo.
  const passenger = firstName && zone ? { firstName, zone } : DEMO_PASSENGER;

  const editDetails = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/e/[id]/join', params: { id } });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {event ? (
        <DriverList
          contextLabel={t('rides.eventLabel', {
            type: t(`event.types.${event.type}`),
            title: event.title,
            date: formatShortDate(event.startsAt, language),
            context: STARTS_WITH_VOWEL.test(event.title) ? 'vowel' : undefined,
          })}
          passenger={passenger}
          matches={DEMO_MATCHES}
          onEdit={editDetails}
          onOpenRide={(offer) =>
            router.push({ pathname: '/e/[id]/ride/[rideId]', params: { id, rideId: offer.id } })
          }
          // L'écran suivant n'a pas encore de maquette.
          onFound={() => {}}
        />
      ) : (
        <Screen>
          <AppText>{t('event.notFound')}</AppText>
        </Screen>
      )}
    </>
  );
}
