import { Check, MessageCircle, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CopyField } from '@/components/ui/CopyField';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { IconCircle } from '@/components/ui/IconCircle';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/lib/design/use-theme';
import type { EventSummary } from '@/lib/events/types';
import { displayUrl } from '@/lib/events/share';

import { EventSummaryCard } from './EventSummaryCard';

type EventShareProps = {
  event: EventSummary;
  /** Lien complet de l'événement, à copier et à envoyer. */
  link: string;
  onClose: () => void;
  /** Reçoit le message à envoyer (lien compris). */
  onShare: (message: string) => void;
  onOpenDashboard: () => void;
};

/** Écran O2 : l'événement est créé, l'organisateur partage le lien à ses invités. */
export function EventShare({ event, link, onClose, onShare, onOpenDashboard }: EventShareProps) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const message = t('eventReady.message', { name: event.title, link });

  return (
    <Screen
      footer={
        <>
          <Button
            label={t('eventReady.whatsapp')}
            icon={<Icon as={MessageCircle} color="onPrimary" />}
            onPress={() => onShare(message)}
          />
          <Button
            variant="outlineStrong"
            label={t('eventReady.dashboard')}
            onPress={onOpenDashboard}
          />
        </>
      }>
      <View style={{ alignItems: 'flex-start' }}>
        <IconButton icon={X} label={t('common.close')} onPress={onClose} />
      </View>

      <View style={{ gap: spacing.md }}>
        <IconCircle icon={Check} />
        <AppText variant="title" accessibilityRole="header">
          {t('eventReady.title')}
        </AppText>
        <AppText color="textMuted">{t('eventReady.description')}</AppText>
      </View>

      <EventSummaryCard event={event} />

      <CopyField
        label={displayUrl(link)}
        value={link}
        accessibilityLabel={t('eventReady.linkLabel')}
      />

      <View style={{ gap: spacing.sm }}>
        <AppText variant="label" color="textMuted">
          {t('eventReady.messageLabel')}
        </AppText>
        <Card>
          <AppText>{message}</AppText>
        </Card>
      </View>
    </Screen>
  );
}
