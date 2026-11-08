import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useTheme } from '@/lib/design/use-theme';
import type { Trip } from '@/lib/trips/types';

import { TripCard } from './TripCard';

type PastTripsProps = {
  trips: Trip[];
  onBack: () => void;
  onOpenTrip: (id: string) => void;
};

/** Historique des trajets de l'utilisateur, du plus récent au plus ancien. */
export function PastTrips({ trips, onBack, onOpenTrip }: PastTripsProps) {
  const { t } = useTranslation();
  const { spacing } = useTheme();

  return (
    <Screen>
      <ScreenHeader action="back" onAction={onBack} title={t('tabs.trips')} />
      <AppText variant="title" accessibilityRole="header">
        {t('trips.pastTitle')}
      </AppText>
      <View style={{ gap: spacing.md }}>
        {trips.length > 0 ? (
          trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onPress={() => onOpenTrip(trip.id)} />
          ))
        ) : (
          <AppText color="textMuted">{t('trips.pastEmpty')}</AppText>
        )}
      </View>
    </Screen>
  );
}
