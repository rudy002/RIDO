import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';

import { RideDetails } from '@/components/rides/RideDetails';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { callUrl, whatsappUrl } from '@/lib/contact/contact';
import { useTheme } from '@/lib/design/use-theme';
import { findMockEvent } from '@/lib/events/mock';
import { formatTime } from '@/lib/i18n/format';
import { findMockMatch, findMockOtherLeg } from '@/lib/rides/mock';

/** T : fiche d'un trajet proposé pour un événement. */
export default function RideDetailsRoute() {
  const { id, rideId } = useLocalSearchParams<{ id: string; rideId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = useTheme();
  const event = findMockEvent(id);
  const match = findMockMatch(rideId);

  // Sans application pour ouvrir le lien (ex. : WhatsApp absent sur ordinateur), rien ne se passe.
  const open = (url: string) => void Linking.openURL(url).catch(() => undefined);

  // Ouvert depuis un lien partagé, il n'y a pas d'écran précédent : retour à la liste.
  const goBack = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/e/[id]/rides', params: { id } });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {event && match ? (
        <RideDetails
          offer={match.offer}
          otherLeg={findMockOtherLeg(match)?.offer}
          destination={{
            title: event.venue,
            subtitle: t('event.startsAt', { time: formatTime(event.startsAt, language) }),
          }}
          onBack={goBack}
          onCall={() => open(callUrl(match.offer.driver.phone))}
          onMessage={() =>
            open(
              whatsappUrl(
                match.offer.driver.phone,
                t('rideDetails.whatsappMessage', { name: match.offer.driver.firstName })
              )
            )
          }
        />
      ) : (
        <Screen>
          <AppText>{t(event ? 'rideDetails.notFound' : 'event.notFound')}</AppText>
        </Screen>
      )}
    </>
  );
}
