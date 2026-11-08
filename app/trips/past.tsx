import { Stack, useRouter } from 'expo-router';
import { useMemo } from 'react';

import { PastTrips } from '@/components/rides/PastTrips';
import { myRidePath } from '@/lib/data/navigation';
import { tripsOf } from '@/lib/data/selectors';
import { useAppData } from '@/lib/data/store';

/** Trajets passés de l'utilisateur. */
export default function PastTripsRoute() {
  const router = useRouter();
  const data = useAppData();
  const { past } = useMemo(() => tripsOf(data, new Date()), [data]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <PastTrips
        trips={past}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        onOpenTrip={(eventId) => router.push(myRidePath(data, eventId))}
      />
    </>
  );
}
