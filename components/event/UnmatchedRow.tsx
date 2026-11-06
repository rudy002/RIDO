import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/lib/design/use-theme';

type UnmatchedRowProps = {
  name: string;
  /** « Ashkelon · 1 personne ». */
  info: string;
  onRelaunch: () => void;
};

/** Invité encore sans trajet, que l'organisateur peut relancer. */
export function UnmatchedRow({ name, info, onRelaunch }: UnmatchedRowProps) {
  const { t } = useTranslation();
  const { spacing } = useTheme();

  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong">{name}</AppText>
        <AppText color="textMuted">{info}</AppText>
      </View>
      <Button
        variant="outlineSmall"
        label={t('dashboard.relaunch')}
        accessibilityHint={name}
        onPress={onRelaunch}
        style={{ paddingHorizontal: spacing.lg }}
      />
    </Card>
  );
}
