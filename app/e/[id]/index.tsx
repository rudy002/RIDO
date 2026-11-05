import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EventInvitation } from '@/components/event/EventInvitation';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { findMockEvent } from '@/lib/events/mock';

/** Lien d'invitation : rido://e/<id> et /e/<id> sur le web. */
export default function EventInvitationRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const event = findMockEvent(id);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {event ? (
        <EventInvitation
          event={event}
          onJoin={() => router.push({ pathname: '/e/[id]/join', params: { id: event.id } })}
        />
      ) : (
        <Screen>
          <AppText>{t('event.notFound')}</AppText>
        </Screen>
      )}
    </>
  );
}
