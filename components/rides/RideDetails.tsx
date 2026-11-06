import { MessageCircle, Phone } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { BackButton } from '@/components/ui/BackButton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { RouteTimeline, type RouteStop } from '@/components/ui/RouteTimeline';
import { Screen } from '@/components/ui/Screen';
import { SeatRow } from '@/components/ui/SeatRow';
import { useTheme } from '@/lib/design/use-theme';
import { formatDay, formatTime } from '@/lib/i18n/format';
import type { RideOffer } from '@/lib/rides/types';

import { OtherLegCard } from './OtherLegCard';

type RideDetailsProps = {
  offer: RideOffer;
  /** Le trajet du même conducteur dans l'autre sens, s'il le fait. */
  otherLeg?: RideOffer;
  /** Le bout du trajet côté destination (lieu de l'événement, ou autre en v2). */
  destination: RouteStop;
  onBack: () => void;
  onCall: () => void;
  onMessage: () => void;
};

/** Écran T : fiche d'un trajet, pour réserver en contactant directement le conducteur. */
export function RideDetails({
  offer,
  otherLeg,
  destination,
  onBack,
  onCall,
  onMessage,
}: RideDetailsProps) {
  const { t } = useTranslation();
  const { colors, sizes, spacing, language } = useTheme();
  const { driver, home, departure, direction, seats } = offer;
  const name = `${driver.firstName} ${driver.lastName}`;
  const homeLabel = home.area ? `${home.city}, ${home.area}` : home.city;

  const from = formatTime(departure.from, language);
  const leaves = departure.to
    ? t('rideDetails.departure.window', { from, to: formatTime(departure.to, language) })
    : t('rideDetails.departure.around', { time: from });

  // À l'aller on part de chez le conducteur ; au retour, du lieu de destination.
  const stops =
    direction === 'outbound'
      ? { from: { title: leaves, subtitle: homeLabel }, to: destination }
      : { from: { title: leaves, subtitle: destination.title }, to: { title: homeLabel } };

  return (
    <Screen
      footer={
        <>
          <Button
            label={t('rideDetails.call', { name: driver.firstName })}
            icon={<Icon as={Phone} color="onPrimary" />}
            onPress={onCall}
          />
          <Button
            variant="inverseLarge"
            label={t('rideDetails.whatsapp')}
            icon={<Icon as={MessageCircle} color="onInverse" />}
            onPress={onMessage}
          />
        </>
      }>
      <View style={{ alignItems: 'flex-start' }}>
        <BackButton onPress={onBack} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
        <Avatar name={name} size="large" />
        <View style={{ flex: 1 }}>
          <AppText variant="title" accessibilityRole="header">
            {name}
          </AppText>
          <AppText variant="label" color="textMuted">
            {`${t('rideDetails.role')} · ${homeLabel}`}
          </AppText>
        </View>
      </View>

      <Card style={{ gap: spacing.lg }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.md,
          }}>
          <Badge tone="inverse" label={t(`rideDetails.directions.${direction}`)} />
          <AppText variant="label" color="textMuted">
            {formatDay(departure.from, language)}
          </AppText>
        </View>
        <RouteTimeline from={stops.from} to={stops.to} />
        <View style={{ height: sizes.borderHairline, backgroundColor: colors.divider }} />
        <SeatRow total={seats.total} free={seats.free} />
      </Card>

      {otherLeg ? <OtherLegCard offer={otherLeg} /> : null}

      <AppText color="textMuted">{t('rideDetails.note', { name: driver.firstName })}</AppText>
    </Screen>
  );
}
