import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';

import { EventNotFound } from '@/components/event/EventNotFound';
import { useEventLabel } from '@/components/event/use-event-label';
import { DriverDashboard } from '@/components/rides/DriverDashboard';
import { whatsappUrl } from '@/lib/contact/contact';
import { cancelDriving, changeSeats } from '@/lib/data/commands';
import { useEventContext, useSingleFlight } from '@/lib/data/hooks';
import { describeZone } from '@/lib/data/matching';
import { driverLegsOf, nearbyRequests } from '@/lib/data/selectors';
import type { DriverLeg, TripDirection } from '@/lib/rides/types';

/** C3 — la voiture du conducteur, après publication. */
export default function MyCarRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const once = useSingleFlight();
  const { data, event, summary, me, language, loading } = useEventContext(id);
  const contextLabel = useEventLabel(summary);
  const records = useMemo(() => (me ? driverLegsOf(data, me) : {}), [data, me]);
  const requests = useMemo(
    () => (me ? nearbyRequests(data, me, language) : []),
    [data, me, language]
  );

  if (!event || !summary) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <EventNotFound loading={loading} />
      </>
    );
  }
  if (!me) return <Redirect href={{ pathname: '/e/[id]', params: { id: event.id } }} />;
  if (me.role !== 'driver') {
    return <Redirect href={{ pathname: '/e/[id]/rides', params: { id: event.id } }} />;
  }
  // Inscrit comme conducteur mais voiture pas encore publiée : on la décrit d'abord.
  if (!records.outbound && !records.return) {
    return <Redirect href={{ pathname: '/e/[id]/car', params: { id: event.id } }} />;
  }

  const legs: Partial<Record<TripDirection, DriverLeg>> = {};
  for (const direction of ['outbound', 'return'] as const) {
    const record = records[direction];
    if (record) legs[direction] = record;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DriverDashboard
        contextLabel={contextLabel}
        // La ville seule : « Départ d'Ashdod », « Ils cherchent depuis Ashdod ».
        driver={{ firstName: me.firstName, zone: describeZone(me.zone, language).city }}
        legs={legs}
        requests={requests}
        onEdit={() => router.push({ pathname: '/e/[id]/car', params: { id: event.id } })}
        onBack={() =>
          router.canGoBack()
            ? router.back()
            : router.replace({ pathname: '/e/[id]', params: { id: event.id } })
        }
        onContact={({ passenger }) =>
          void Linking.openURL(
            whatsappUrl(passenger.phone, t('myCar.whatsappMessage', { name: passenger.firstName }))
          ).catch(() => undefined)
        }
        onBookingsChange={(direction, bookings) => {
          const record = records[direction];
          if (record) void changeSeats(record.id, record.bookings, bookings);
        }}
        onCancel={() =>
          void once(async () => {
            if (await cancelDriving(event.id)) {
              router.replace({ pathname: '/e/[id]', params: { id: event.id } });
            }
          })
        }
      />
    </>
  );
}
