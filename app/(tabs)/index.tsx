import { MyTrips } from '@/components/rides/MyTrips';
import { DEMO_PAST_TRIPS_COUNT, DEMO_UPCOMING_TRIPS, DEMO_USER } from '@/lib/trips/mock';

/** A1 : accueil de l'appli, « Mes trajets ». */
export default function MyTripsRoute() {
  return (
    <MyTrips
      // Pas encore de compte ni de stockage : données de démo.
      firstName={DEMO_USER.firstName}
      upcoming={DEMO_UPCOMING_TRIPS}
      pastCount={DEMO_PAST_TRIPS_COUNT}
      // La fiche d'un trajet de l'utilisateur et l'historique n'ont pas encore de maquette.
      onOpenTrip={() => {}}
      onOpenPast={() => {}}
    />
  );
}
