import type { Colors } from '@/lib/design/tokens';
import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';
import { Card, type CardTone } from './Card';

export type StatTone = 'neutral' | 'success' | 'danger';

type StatTileProps = {
  value: string;
  label: string;
  tone?: StatTone;
  /** Plus petit, pour trois tuiles côte à côte. */
  compact?: boolean;
};

const TONES: Record<StatTone, { card: CardTone; text: keyof Colors }> = {
  neutral: { card: 'surface', text: 'text' },
  success: { card: 'success', text: 'successText' },
  danger: { card: 'danger', text: 'dangerText' },
};

/** Chiffre clé avec son libellé (« 14 places proposées »). */
export function StatTile({ value, label, tone = 'neutral', compact = false }: StatTileProps) {
  const { spacing } = useTheme();
  const { card, text } = TONES[tone];

  return (
    <Card
      tone={card}
      accessible
      accessibilityLabel={`${value} ${label}`}
      style={[{ flex: 1, gap: spacing.xs }, compact && { padding: spacing.md }]}>
      <AppText variant={compact ? 'stat' : 'display'} color={text}>
        {value}
      </AppText>
      <AppText
        variant={compact ? 'caption' : 'label'}
        color={compact && tone === 'neutral' ? 'textMuted' : text}>
        {label}
      </AppText>
    </Card>
  );
}
