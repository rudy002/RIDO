import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';

import { useEventLabel } from '@/components/event/use-event-label';
import { DriverDashboard } from '@/components/rides/DriverDashboard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { whatsappUrl } from '@/lib/contact/contact';
import { findMockEvent } from '@/lib/events/mock';
import { legsOfDraft, parseCarDraft } from '@/lib/rides/car-draft';
import { DEMO_DRIVER, DEMO_DRIVER_LEGS, DEMO_REQUESTS } from '@/lib/rides/mock';

/** C3 : la voiture du conducteur, après publication. */
export default function MyCarRoute() {
  const { id, firstName, zone, ride } = useLocalSearchParams<{
    id: string;
    firstName?: string;
    zone?: string;
    ride?: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();
  const event = findMockEvent(id);
  const contextLabel = useEventLabel(event);

  // Pas encore de stockage : les infos viennent des étapes précédentes, sinon de la démo.
  const driver = firstName && zone ? { firstName, zone } : DEMO_DRIVER;
  const draft = parseCarDraft(ride);
  const legs = draft ? legsOfDraft(draft) : DEMO_DRIVER_LEGS;
  const requests = DEMO_REQUESTS.filter((request) => request.home.city === driver.zone);

  const editRide = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/e/[id]/car', params: { id } });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {event ? (
        <DriverDashboard
          contextLabel={contextLabel}
          driver={driver}
          legs={legs}
          requests={requests}
          onEdit={editRide}
          onContact={({ passenger }) =>
            void Linking.openURL(
              whatsappUrl(
                passenger.phone,
                t('myCar.whatsappMessage', { name: passenger.firstName })
              )
            ).catch(() => undefined)
          }
          // Annuler un trajet demandera de prévenir les passagers : écran à venir.
          onCancel={() => {}}
        />
      ) : (
        <Screen>
          <AppText>{t('event.notFound')}</AppText>
        </Screen>
      )}
    </>
  );
}
