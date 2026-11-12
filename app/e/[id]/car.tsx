import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EventNotFound } from '@/components/event/EventNotFound';
import { CarForm } from '@/components/rides/CarForm';
import { publishCar } from '@/lib/data/commands';
import { useEventContext, useSingleFlight } from '@/lib/data/hooks';
import { directionsOf, driverLegsOf } from '@/lib/data/selectors';
import { formatTime } from '@/lib/i18n/format';
import { bookedSeats } from '@/lib/rides/bookings';
import { addMinutes } from '@/lib/rides/time-slots';
import { MIN_FREE_SEATS, type Departure, type TimeWindow } from '@/lib/rides/types';

/** Créneau d'une demi-heure par défaut. */
const WINDOW_MINUTES = 30;
const windowOf = ({ from, to }: Departure): TimeWindow => ({
  from,
  to: to ?? addMinutes(from, WINDOW_MINUTES),
});

/** C2 — étape 2 du conducteur : sa voiture et ses horaires (aussi pour les modifier). */
export default function CarRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const once = useSingleFlight();
  const { data, event, summary, me, language, loading } = useEventContext(id);

  if (!event || !summary) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <EventNotFound loading={loading} />
      </>
    );
  }
  if (!me || me.role !== 'driver') {
    return <Redirect href={{ pathname: '/e/[id]/join', params: { id: event.id } }} />;
  }

  const published = driverLegsOf(data, me);
  const anyLeg = published.outbound ?? published.return;
  const goBack = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/e/[id]/join', params: { id: event.id } });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <CarForm
        directions={directionsOf(event, me)}
        defaults={{
          // Ce qui est déjà publié, sinon une demi-heure à partir du créneau conseillé.
          outbound: published.outbound
            ? windowOf(published.outbound.departure)
            : windowOf({ from: summary.outboundWindow.from }),
          return: published.return
            ? windowOf(published.return.departure)
            : { from: addMinutes(summary.returnAround, -WINDOW_MINUTES), to: summary.returnAround },
        }}
        initialSeats={anyLeg?.totalSeats ?? data.profile?.car.seats}
        minSeats={Math.max(
          MIN_FREE_SEATS,
          ...Object.values(published).map((leg) => bookedSeats(leg.bookings))
        )}
        outboundHint={t('car.outbound.hint', { time: formatTime(event.startsAt, language) })}
        onBack={goBack}
        onSubmit={(draft) =>
          void once(async () => {
            if (!(await publishCar(event.id, draft))) return;
            // Revient à la voiture si on venait de « Modifier », sinon l'ouvre.
            router.dismissTo({ pathname: '/e/[id]/my-car', params: { id: event.id } });
          })
        }
      />
    </>
  );
}
