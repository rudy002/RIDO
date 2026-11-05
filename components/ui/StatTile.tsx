import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';
import { Card } from './Card';

type StatTileProps = {
  value: string;
  label: string;
  tone?: 'surface' | 'success';
};

/** Chiffre clé avec son libellé (« 14 places proposées »). */
export function StatTile({ value, label, tone = 'surface' }: StatTileProps) {
  const { spacing } = useTheme();
  const color = tone === 'success' ? 'seatFreeText' : 'text';

  return (
    <Card
      tone={tone}
      accessible
      accessibilityLabel={`${value} ${label}`}
      style={{ flex: 1, gap: spacing.xs }}>
      <AppText variant="display" color={color}>
        {value}
      </AppText>
      <AppText variant="label" color={color}>
        {label}
      </AppText>
    </Card>
  );
}
