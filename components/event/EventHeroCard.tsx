import { Calendar, MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { InfoRow } from '@/components/ui/InfoRow';
import { useTheme } from '@/lib/design/use-theme';
import type { EventType } from '@/lib/events/types';
import { formatSchedule } from '@/lib/i18n/format';

type EventHeroCardProps = {
  type: EventType;
  title: string;
  startsAt: Date;
  endsAt: Date;
  venue: string;
  organizerName: string;
};

/** Grande carte d'en-tête d'un événement : type, nom, date, lieu, organisateur. */
export function EventHeroCard({
  type,
  title,
  startsAt,
  endsAt,
  venue,
  organizerName,
}: EventHeroCardProps) {
  const { t } = useTranslation();
  const { language, spacing } = useTheme();

  return (
    <Card tone="inverse" style={{ padding: spacing.xl, gap: spacing.lg }}>
      <Badge label={t(`event.types.${type}`)} tone="primary" />
      <AppText variant="display" color="onInverse" accessibilityRole="header">
        {title}
      </AppText>
      <View style={{ gap: spacing.sm }}>
        <InfoRow
          icon={Calendar}
          text={formatSchedule(startsAt, endsAt, language)}
          color="onInverse"
        />
        <InfoRow icon={MapPin} text={venue} color="onInverse" />
      </View>
      <AppText color="onInverseMuted">{t('event.organizedBy', { name: organizerName })}</AppText>
    </Card>
  );
}
