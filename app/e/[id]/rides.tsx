import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';

import { EventNotFound } from '@/components/event/EventNotFound';
import { useEventLabel } from '@/components/event/use-event-label';
import { DriverList } from '@/components/rides/DriverList';
import { markFound, searchAgain } from '@/lib/data/commands';
import { useEventContext } from '@/lib/data/hooks';
import { describeZone } from '@/lib/data/matching';
import { directionsOf, matchesFor, passengerStatusOf } from '@/lib/data/selectors';

/** P1 — conducteurs disponibles pour un passager. */
export default function DriverListRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, event, summary, me, language, loading } = useEventContext(id);
  const contextLabel = useEventLabel(summary);
  const matches = useMemo(() => (me ? matchesFor(data, me, language) : []), [data, me, language]);
  const status = useMemo(() => (me ? passengerStatusOf(data, me) : {}), [data, me]);

  if (!event || !summary) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <EventNotFound loading={loading} />
      </>
    );
  }
  // Pas encore inscrit comme passager : retour à l'invitation (ou à sa voiture s'il conduit).
  if (!me) return <Redirect href={{ pathname: '/e/[id]', params: { id: event.id } }} />;
  if (me.role === 'driver')
    return <Redirect href={{ pathname: '/e/[id]/my-car', params: { id: event.id } }} />;

  // « Modifier » rouvre l'inscription ; la flèche revient d'où l'on vient (sinon à l'invitation).
  const editDetails = () => router.push({ pathname: '/e/[id]/join', params: { id: event.id } });
  const goBack = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/e/[id]', params: { id: event.id } });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DriverList
        contextLabel={contextLabel}
        // La ville seule en titre, comme sur la maquette (« Ashdod »).
        passenger={{
          firstName: me.firstName,
          zone: describeZone(me.zone, language).city,
          partySize: me.partySize,
        }}
        matches={matches}
        directions={directionsOf(event, me)}
        status={status}
        onEdit={editDetails}
        onBack={goBack}
        onOpenRide={(offer) =>
          router.push({
            pathname: '/e/[id]/ride/[rideId]',
            params: { id: event.id, rideId: offer.id },
          })
        }
        // Affiché aussitôt ; si le serveur refuse (voiture pleine…), l'écran revient en arrière et
        // la raison est affichée.
        onFound={(direction, offerId) => void markFound(event.id, direction, offerId)}
        onSearchAgain={(direction) => void searchAgain(event.id, direction)}
      />
    </>
  );
}
