import { Stack, useRouter } from 'expo-router';

import { CreateEventForm } from '@/components/event/CreateEventForm';
import { createMockEvent } from '@/lib/events/mock';
import { deviceCountry } from '@/lib/phone/phone';

/** O1 : création d'un événement par l'organisateur, ouverte par-dessus l'écran courant. */
export default function NewEventRoute() {
  const router = useRouter();

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <CreateEventForm
        onClose={close}
        // Pas encore de serveur : l'événement est gardé en mémoire le temps de la session.
        onCreate={(draft) => {
          const event = createMockEvent(draft, deviceCountry());
          router.replace({ pathname: '/events/[id]/share', params: { id: event.id } });
        }}
      />
    </>
  );
}
