import { Stack, useRouter } from 'expo-router';

import { CreateEventForm } from '@/components/event/CreateEventForm';
import { createEvent } from '@/lib/data/commands';
import { useSingleFlight } from '@/lib/data/hooks';
import { deviceCountry } from '@/lib/phone/phone';
import { defaultEventCountry } from '@/lib/places/places';
import { askForNotifications } from '@/lib/notifications/use-notifications';

/** O1 : création d'un événement par l'organisateur, ouverte par-dessus l'écran courant. */
export default function NewEventRoute() {
  const router = useRouter();
  const once = useSingleFlight();

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <CreateEventForm
        onClose={close}
        onCreate={(draft) =>
          void once(async () => {
            const eventId = await createEvent(draft, defaultEventCountry(deviceCountry()));
            // Refusé (pas de réseau…) : on reste sur le formulaire, la raison est affichée.
            if (eventId) askForNotifications();
            if (eventId)
              router.replace({ pathname: '/events/[id]/share', params: { id: eventId } });
          })
        }
      />
    </>
  );
}
