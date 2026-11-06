import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useEventLabel } from '@/components/event/use-event-label';
import { DriverList } from '@/components/rides/DriverList';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { findMockEvent } from '@/lib/events/mock';
import { DEMO_MATCHES, DEMO_PASSENGER } from '@/lib/rides/mock';

/** P1 : conducteurs disponibles pour un passager. */
export default function DriverListRoute() {
  const { id, firstName, zone } = useLocalSearchParams<{
    id: string;
    firstName?: string;
    zone?: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();
  const event = findMockEvent(id);
  const contextLabel = useEventLabel(event);

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
          contextLabel={contextLabel}
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
