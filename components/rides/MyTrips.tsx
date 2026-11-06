import { Link2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { InfoNote } from '@/components/ui/InfoNote';
import { LinkRow } from '@/components/ui/LinkRow';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/lib/design/use-theme';
import type { Trip } from '@/lib/trips/types';

import { TripCard } from './TripCard';

type MyTripsProps = {
  /** Absent tant que l'utilisateur n'a pas donné son prénom. */
  firstName?: string;
  upcoming: Trip[];
  pastCount: number;
  onOpenTrip: (id: string) => void;
  onOpenPast: () => void;
};

/** Écran A1 : accueil de l'appli, les trajets à venir de l'utilisateur. */
export function MyTrips({ firstName, upcoming, pastCount, onOpenTrip, onOpenPast }: MyTripsProps) {
  const { t } = useTranslation();
  const { spacing } = useTheme();

  return (
    <Screen aboveTabBar>
      <View style={{ gap: spacing.xs }}>
        {firstName ? (
          <AppText variant="bodyStrong" color="textMuted">
            {t('rides.greeting', { name: firstName })}
          </AppText>
        ) : null}
        <AppText variant="display" accessibilityRole="header">
          {t('trips.title')}
        </AppText>
      </View>

      {upcoming.length > 0 ? (
        <View style={{ gap: spacing.md }}>
          <AppText variant="overline" color="textMuted" accessibilityRole="header">
            {t('trips.upcoming')}
          </AppText>
          {upcoming.map((trip) => (
            <TripCard key={trip.id} trip={trip} onPress={() => onOpenTrip(trip.id)} />
          ))}
        </View>
      ) : (
        <AppText variant="heading">{t('trips.empty')}</AppText>
      )}

      {pastCount > 0 ? (
        <LinkRow label={t('trips.past', { count: pastCount })} onPress={onOpenPast} />
      ) : null}

      <InfoNote icon={Link2} text={t('trips.linkHint')} />
    </Screen>
  );
}
