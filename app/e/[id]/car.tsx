import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { CarForm } from '@/components/rides/CarForm';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/lib/design/use-theme';
import { findMockEvent } from '@/lib/events/mock';
import { formatTime } from '@/lib/i18n/format';
import { addMinutes } from '@/lib/rides/time-slots';
import { TRIP_DIRECTIONS, type TripDirection } from '@/lib/rides/types';

const isDirection = (value: string): value is TripDirection =>
  TRIP_DIRECTIONS.some((direction) => direction === value);

/** C2 : étape 2 du conducteur, sa voiture et ses horaires. */
export default function CarRoute() {
  const { id, directions } = useLocalSearchParams<{ id: string; directions?: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = useTheme();
  const event = findMockEvent(id);

  // Sens choisis à l'étape 1 (« outbound,return ») ; les deux si l'écran est ouvert directement.
  const chosen = (directions ?? '').split(',').filter(isDirection);

  const goBack = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/e/[id]/join', params: { id } });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {event ? (
        <CarForm
          directions={chosen.length > 0 ? chosen : [...TRIP_DIRECTIONS]}
          defaults={{
            // Une demi-heure de marge par défaut, à partir du créneau conseillé par l'organisateur.
            outbound: {
              from: event.outboundWindow.from,
              to: addMinutes(event.outboundWindow.from, 30),
            },
            return: { from: addMinutes(event.returnAround, -30), to: event.returnAround },
          }}
          outboundHint={t('car.outbound.hint', { time: formatTime(event.startsAt, language) })}
          onBack={goBack}
          // Aucun serveur pour l'instant ; l'écran suivant n'a pas encore de maquette.
          onSubmit={() => {}}
        />
      ) : (
        <Screen>
          <AppText>{t('event.notFound')}</AppText>
        </Screen>
      )}
    </>
  );
}
