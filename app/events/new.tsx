import { Stack, useRouter } from 'expo-router';

import { CreateEventForm } from '@/components/event/CreateEventForm';
import { createEvent } from '@/lib/data/actions';
import { getAppData, updateAppData } from '@/lib/data/store';
import { deviceCountry } from '@/lib/phone/phone';
import { defaultEventCountry } from '@/lib/places/places';

/** O1 : création d'un événement par l'organisateur, ouverte par-dessus l'écran courant. */
export default function NewEventRoute() {
  const router = useRouter();

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <CreateEventForm
        onClose={close}
        onCreate={(draft) => {
          const { data, eventId } = createEvent(
            getAppData(),
            draft,
            defaultEventCountry(deviceCountry())
          );
          updateAppData(() => data);
          router.replace({ pathname: '/events/[id]/share', params: { id: eventId } });
        }}
      />
    </>
  );
}
