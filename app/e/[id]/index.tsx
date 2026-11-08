import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { EventInvitation } from '@/components/event/EventInvitation';
import { EventNotFound } from '@/components/event/EventNotFound';
import { useEventContext } from '@/lib/data/hooks';
import { myRidePath } from '@/lib/data/navigation';
import { isOrganizer } from '@/lib/data/selectors';

/** I1 — lien d'invitation : rido://e/<id> et /e/<id> sur le web. */
export default function EventInvitationRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, event, summary, me } = useEventContext(id);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {event && summary ? (
        <EventInvitation
          event={summary}
          registeredAs={me?.role}
          isOrganizer={isOrganizer(data, event)}
          onJoin={() => router.push({ pathname: '/e/[id]/join', params: { id: event.id } })}
          onOpenMyRide={() => router.push(myRidePath(data, event.id))}
          onOpenDashboard={() =>
            router.push({ pathname: '/events/[id]', params: { id: event.id } })
          }
        />
      ) : (
        <EventNotFound />
      )}
    </>
  );
}
