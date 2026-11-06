import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/lib/design/use-theme';
import { formatTime } from '@/lib/i18n/format';
import type { RideOffer } from '@/lib/rides/types';

type OtherLegCardProps = {
  offer: RideOffer;
};

/** Résumé de l'autre trajet du même conducteur : « Retour · Repart entre 00h30 et 01h00 · 2 libres ». */
export function OtherLegCard({ offer }: OtherLegCardProps) {
  const { t } = useTranslation();
  const { spacing, language } = useTheme();
  const { direction, departure, seats } = offer;
  const from = formatTime(departure.from, language);
  const when = departure.to
    ? t(`rideDetails.otherLeg.${direction}Window`, {
        from,
        to: formatTime(departure.to, language),
      })
    : t(`rideDetails.otherLeg.${direction}Around`, { time: from });
  const full = seats.free <= 0;

  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <View style={{ flex: 1 }}>
        <AppText variant="label" color="textMuted">
          {t(`rideDetails.directions.${direction}`)}
        </AppText>
        <AppText variant="bodyStrong">{when}</AppText>
      </View>
      <AppText variant="heading" color={full ? 'textMuted' : 'seatFreeText'}>
        {full ? t('seats.full') : t('seats.free', { count: seats.free })}
      </AppText>
    </Card>
  );
}
