import { MessageCircle, Phone } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { useTheme } from '@/lib/design/use-theme';
import type { RideRequest } from '@/lib/rides/types';

type PassengerCardProps = { request: RideRequest } & (
  | {
      /** Passager qui cherche encore : un bouton pour lui proposer une place. */
      onContact: () => void;
    }
  | {
      /** Passager déjà dans la voiture : l'appeler ou lui écrire (heure, lieu de rendez-vous). */
      onCall: () => void;
      onMessage: () => void;
    }
);

/** Un passager : qui, combien, d'où ; et de quoi le joindre. */
export function PassengerCard(props: PassengerCardProps) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const { passenger, home, partySize } = props.request;
  const name = `${passenger.firstName} ${passenger.lastName}`;

  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
      <Avatar name={name} />
      <View style={{ flex: 1 }}>
        <AppText variant="heading">{name}</AppText>
        <AppText color="textMuted">
          {`${t('myCar.people', { count: partySize })} · ${home.area ?? home.city}`}
        </AppText>
      </View>
      {'onContact' in props ? (
        <Button
          variant="primarySmall"
          label={t('myCar.contact')}
          accessibilityHint={name}
          onPress={props.onContact}
          style={{ paddingHorizontal: spacing.lg }}
        />
      ) : (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <IconButton
            icon={Phone}
            tone="primary"
            label={t('myCar.inCar.call', { name: passenger.firstName })}
            onPress={props.onCall}
          />
          <IconButton
            icon={MessageCircle}
            tone="inverse"
            label={t('myCar.inCar.whatsapp', { name: passenger.firstName })}
            onPress={props.onMessage}
          />
        </View>
      )}
    </Card>
  );
}
