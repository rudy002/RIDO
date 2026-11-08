import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { EventNotFound } from '@/components/event/EventNotFound';
import { JoinRideForm } from '@/components/rides/JoinRideForm';
import { joinEvent } from '@/lib/data/actions';
import { useEventContext } from '@/lib/data/hooks';
import { driverLegsOf } from '@/lib/data/selectors';
import { getAppData, updateAppData } from '@/lib/data/store';

/** I2 — étape 1 du parcours invité : comment viens-tu ? (aussi pour modifier son inscription) */
export default function JoinRideRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, event, summary, me } = useEventContext(id);

  // Ouvert directement depuis un lien web, il n'y a pas d'écran précédent : on revient à l'invitation.
  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace({ pathname: '/e/[id]', params: { id } });

  if (!event || !summary) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <EventNotFound />
      </>
    );
  }

  // Modifier son inscription, sinon reprendre ce que le profil connaît déjà.
  const initial = me
    ? { ...me }
    : data.profile
      ? {
          firstName: data.profile.firstName,
          lastName: data.profile.lastName,
          phone: data.profile.phone,
          ...(data.profile.car.usualDeparture ? { zone: data.profile.car.usualDeparture } : {}),
        }
      : undefined;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <JoinRideForm
        outboundWindow={summary.outboundWindow}
        returnAround={summary.returnAround}
        activeZones={summary.activeZones}
        defaultCountry={event.country}
        directions={event.directions}
        initial={initial}
        onBack={goBack}
        onSubmit={(draft) => {
          updateAppData((current) => joinEvent(current, event.id, draft));
          // dismissTo : revient à l'écran s'il est déjà ouvert (« Modifier »), sinon l'ouvre.
          if (draft.role === 'passenger') {
            router.dismissTo({ pathname: '/e/[id]/rides', params: { id: event.id } });
            return;
          }
          // Conducteur : sa voiture d'abord (ou directement son tableau de bord s'il l'a déjà publiée
          // pour les trajets choisis).
          const updated = getAppData();
          const mine = updated.participants.find(
            (p) => p.eventId === event.id && p.userId === updated.userId
          );
          const legs = mine ? driverLegsOf(updated, mine) : {};
          const published = draft.directions.every((direction) => legs[direction]);
          router.dismissTo({
            pathname: published ? '/e/[id]/my-car' : '/e/[id]/car',
            params: { id: event.id },
          });
        }}
      />
    </>
  );
}
