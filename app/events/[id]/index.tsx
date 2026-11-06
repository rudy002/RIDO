import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';

import { OrganizerDashboard } from '@/components/event/OrganizerDashboard';
import { useShareEvent } from '@/components/event/use-share-event';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { whatsappUrl } from '@/lib/contact/contact';
import { countMockEvents, findMockEvent, overviewOf } from '@/lib/events/mock';
import { eventShareUrl } from '@/lib/events/share';

/** O3 : tableau de bord de l'organisateur. */
export default function OrganizerDashboardRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const event = findMockEvent(id);
  const shareEvent = useShareEvent();

  if (!event) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <Screen>
          <AppText>{t('event.notFound')}</AppText>
        </Screen>
      </>
    );
  }

  const link = eventShareUrl(event.id);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OrganizerDashboard
        event={event}
        // Sans serveur, les chiffres sont ceux de la démo, même pour un événement tout juste créé.
        overview={overviewOf(event.id)}
        eventsCount={countMockEvents()}
        // Le choix d'un autre événement n'a pas encore de maquette.
        onSwitchEvent={() => {}}
        onShare={() => shareEvent(event)}
        onRelaunch={(guest) =>
          void Linking.openURL(
            whatsappUrl(
              guest.phone,
              t('dashboard.relaunchMessage', {
                name: guest.name.split(' ')[0],
                event: event.title,
                link,
              })
            )
          ).catch(() => undefined)
        }
        onJoin={() => router.push({ pathname: '/e/[id]/join', params: { id: event.id } })}
      />
    </>
  );
}
