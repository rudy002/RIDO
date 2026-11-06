import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/lib/design/use-theme';
import type { RideRequest } from '@/lib/rides/types';

type PassengerCardProps = {
  request: RideRequest;
  onContact: () => void;
};

/** Passager qui cherche un trajet : qui, combien, d'où ; bouton pour le contacter. */
export function PassengerCard({ request, onContact }: PassengerCardProps) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const { passenger, home, partySize } = request;
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
      <Button
        variant="primarySmall"
        label={t('myCar.contact')}
        accessibilityHint={name}
        onPress={onContact}
        style={{ paddingHorizontal: spacing.lg }}
      />
    </Card>
  );
}
