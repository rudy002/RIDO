import { useRouter } from 'expo-router';
import { useMemo } from 'react';

import { MyTrips } from '@/components/rides/MyTrips';
import { myRidePath } from '@/lib/data/navigation';
import { tripsOf } from '@/lib/data/selectors';
import { useAppData } from '@/lib/data/store';

/** A1 : accueil de l'appli, « Mes trajets ». */
export default function MyTripsRoute() {
  const router = useRouter();
  const data = useAppData();
  const { upcoming, past } = useMemo(() => tripsOf(data, new Date()), [data]);

  return (
    <MyTrips
      firstName={data.profile?.firstName}
      upcoming={upcoming}
      pastCount={past.length}
      onOpenTrip={(eventId) => router.push(myRidePath(data, eventId))}
      onOpenPast={() => router.push('/trips/past')}
    />
  );
}
