import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';

import { EventShare } from '@/components/event/EventShare';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { whatsappShareUrl } from '@/lib/contact/contact';
import { findMockEvent } from '@/lib/events/mock';
import { eventShareUrl } from '@/lib/events/share';

/** O2 : l'événement est prêt, partage du lien. */
export default function EventShareRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const event = findMockEvent(id);

  const close = () => router.replace('/');

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {event ? (
        <EventShare
          event={event}
          link={eventShareUrl(event.id)}
          onClose={close}
          onShare={(message) =>
            void Linking.openURL(whatsappShareUrl(message)).catch(() => undefined)
          }
          // Le tableau de bord organisateur (O3) n'a pas encore de maquette.
          onOpenDashboard={() => {}}
        />
      ) : (
        <Screen>
          <AppText>{t('event.notFound')}</AppText>
        </Screen>
      )}
    </>
  );
}
