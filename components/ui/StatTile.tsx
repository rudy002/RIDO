import type { Colors } from '@/lib/design/tokens';
import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';
import { Card, type CardTone } from './Card';

export type StatTone = 'neutral' | 'success' | 'danger';

type StatTileProps = {
  value: string;
  label: string;
  tone?: StatTone;
  /** Grande (accueil d'un événement), moyenne (trois côte à côte), petite (dans une carte). */
  size?: 'large' | 'medium' | 'small';
};

const VALUE_VARIANT = { large: 'display', medium: 'stat', small: 'statSmall' } as const;

const TONES: Record<StatTone, { card: CardTone; text: keyof Colors }> = {
  neutral: { card: 'surface', text: 'text' },
  success: { card: 'success', text: 'successText' },
  danger: { card: 'danger', text: 'dangerText' },
};

/** Chiffre clé avec son libellé (« 14 places proposées »). */
export function StatTile({ value, label, tone = 'neutral', size = 'large' }: StatTileProps) {
  const compact = size !== 'large';
  const { spacing } = useTheme();
  const { card, text } = TONES[tone];

  return (
    <Card
      tone={card}
      accessible
      accessibilityLabel={`${value} ${label}`}
      style={[
        { flex: 1, gap: spacing.xs },
        size === 'medium' && { padding: spacing.md },
        size === 'small' && { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, gap: 0 },
      ]}>
      <AppText variant={VALUE_VARIANT[size]} color={text}>
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
