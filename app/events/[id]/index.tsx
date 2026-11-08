import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';

import { EventNotFound } from '@/components/event/EventNotFound';
import { OrganizerDashboard } from '@/components/event/OrganizerDashboard';
import { useShareEvent } from '@/components/event/use-share-event';
import { whatsappUrl } from '@/lib/contact/contact';
import { useEventContext } from '@/lib/data/hooks';
import { myRidePath } from '@/lib/data/navigation';
import { eventOverview, organizedEvents } from '@/lib/data/selectors';
import { eventShareUrl } from '@/lib/events/share';

/** O3 : tableau de bord de l'organisateur. */
export default function OrganizerDashboardRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const shareEvent = useShareEvent();
  const { data, event, summary, me, language } = useEventContext(id);
  const overview = useMemo(
    () => (event ? eventOverview(data, event, language) : {}),
    [data, event, language]
  );
  const eventsCount = useMemo(
    () => organizedEvents(data, new Date(), language).upcoming.length,
    [data, language]
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {summary ? (
        <OrganizerDashboard
          event={summary}
          overview={overview}
          eventsCount={eventsCount}
          onSwitchEvent={() => router.navigate('/my-events')}
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/my-events'))}
          onShare={() => shareEvent(summary)}
          onRelaunch={(guest) =>
            void Linking.openURL(
              whatsappUrl(
                guest.phone,
                t('dashboard.relaunchMessage', {
                  name: guest.name.split(' ')[0],
                  event: summary.title,
                  link: eventShareUrl(summary.id),
                })
              )
            ).catch(() => undefined)
          }
          registeredAs={me?.role}
          onJoin={() => router.push({ pathname: '/e/[id]/join', params: { id: summary.id } })}
          onOpenMyRide={() => router.push(myRidePath(data, summary.id))}
        />
      ) : (
        <EventNotFound />
      )}
    </>
  );
}
