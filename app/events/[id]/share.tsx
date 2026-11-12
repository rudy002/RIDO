import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Linking } from 'react-native';

import { EventNotFound } from '@/components/event/EventNotFound';
import { EventShare } from '@/components/event/EventShare';
import { whatsappShareUrl } from '@/lib/contact/contact';
import { useEventContext } from '@/lib/data/hooks';
import { eventShareUrl } from '@/lib/events/share';

/** O2 : l'événement est prêt, partage du lien. */
export default function EventShareRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { summary, loading } = useEventContext(id);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {summary ? (
        <EventShare
          event={summary}
          link={eventShareUrl(summary.id)}
          onClose={() => router.replace('/my-events')}
          onShare={(message) =>
            void Linking.openURL(whatsappShareUrl(message)).catch(() => undefined)
          }
          onOpenDashboard={() =>
            router.replace({ pathname: '/events/[id]', params: { id: summary.id } })
          }
        />
      ) : (
        <EventNotFound loading={loading} />
      )}
    </>
  );
}
