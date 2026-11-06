import { Stack, useRouter } from 'expo-router';

import { CreateEventForm } from '@/components/event/CreateEventForm';

/** O1 : création d'un événement par l'organisateur, ouverte par-dessus l'écran courant. */
export default function NewEventRoute() {
  const router = useRouter();

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <CreateEventForm
        onClose={close}
        // Pas encore de serveur ; l'écran O2 (lien de partage) prendra la suite.
        onCreate={() => {}}
      />
    </>
  );
}
