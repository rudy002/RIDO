import { CircleAlert, WifiOff } from 'lucide-react-native';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner } from '@/components/ui/Banner';
import { dismissSyncError, useSyncError } from '@/lib/data/store';
import { useTheme } from '@/lib/design/use-theme';

/** Le message disparaît seul après ce délai (on peut aussi le fermer). */
const VISIBLE_MS = 7000;

/** Explique pourquoi le serveur a refusé la dernière action (pas de réseau, voiture pleine…). */
export function SyncErrorBanner() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const error = useSyncError();

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(dismissSyncError, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [error]);

  if (!error) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: insets.top + spacing.sm,
        start: spacing.lg,
        end: spacing.lg,
      }}>
      <Banner
        icon={error === 'offline' ? WifiOff : CircleAlert}
        text={t(`sync.${error}`)}
        dismissLabel={t('common.close')}
        onDismiss={dismissSyncError}
      />
    </View>
  );
}
