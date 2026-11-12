import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';

import { EventNotFound } from '@/components/event/EventNotFound';
import { RideDetails } from '@/components/rides/RideDetails';
import { callUrl, whatsappUrl } from '@/lib/contact/contact';
import { useEventContext } from '@/lib/data/hooks';
import { offerView, otherLegOf } from '@/lib/data/selectors';
import { formatTime } from '@/lib/i18n/format';

/** T — fiche d'un trajet proposé pour un événement. */
export default function RideDetailsRoute() {
  const { id, rideId } = useLocalSearchParams<{ id: string; rideId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { data, event, language, loading } = useEventContext(id);
  const leg = data.driverLegs.find((d) => d.id === rideId && d.eventId === id);
  const offer = leg ? offerView(data, leg, language) : undefined;
  const other = leg ? otherLegOf(data, leg) : undefined;

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
      {event && offer ? (
        <RideDetails
          offer={offer}
          otherLeg={other ? offerView(data, other, language) : undefined}
          destination={{
            title: event.venue,
            subtitle: t('event.startsAt', { time: formatTime(event.startsAt, language) }),
          }}
          onBack={goBack}
          onCall={() => open(callUrl(offer.driver.phone))}
          onMessage={() =>
            open(
              whatsappUrl(
                offer.driver.phone,
                t('rideDetails.whatsappMessage', { name: offer.driver.firstName })
              )
            )
          }
        />
      ) : (
        <EventNotFound loading={loading} />
      )}
    </>
  );
}
