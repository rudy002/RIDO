import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { JoinRideForm } from '@/components/rides/JoinRideForm';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { findMockEvent } from '@/lib/events/mock';

/** Étape 1 du parcours invité : comment viens-tu ? */
export default function JoinRideRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const event = findMockEvent(id);

  // Ouvert directement depuis un lien web, il n'y a pas d'écran précédent : on revient à l'invitation.
  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace({ pathname: '/e/[id]', params: { id } });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {event ? (
        <JoinRideForm
          outboundWindow={event.outboundWindow}
          returnAround={event.returnAround}
          activeZones={event.activeZones}
          defaultCountry={event.country}
          onBack={goBack}
          // Aucun serveur pour l'instant : les choix passent d'un écran à l'autre par la navigation.
          onSubmit={(draft) => {
            if (draft.role === 'driver') {
              router.push({
                pathname: '/e/[id]/car',
                params: { id, directions: draft.directions.join(',') },
              });
              return;
            }
            router.push({
              pathname: '/e/[id]/rides',
              params: { id, firstName: draft.firstName, zone: draft.zone.name },
            });
          }}
        />
      ) : (
        <Screen>
          <AppText>{t('event.notFound')}</AppText>
        </Screen>
      )}
    </>
  );
}
