import { View } from 'react-native';

import type { Colors } from '@/lib/design/tokens';
import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';

export type BadgeTone = 'primary' | 'accent' | 'success' | 'danger';

const TONES: Record<BadgeTone, { background: keyof Colors; text: keyof Colors }> = {
  primary: { background: 'primary', text: 'onPrimary' },
  accent: { background: 'accentSoft', text: 'onAccentSoft' },
  success: { background: 'seatFree', text: 'seatFreeText' },
  danger: { background: 'dangerSoft', text: 'dangerText' },
};

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
};

/** Pastille (type d'événement, statut). */
export function Badge({ label, tone = 'primary' }: BadgeProps) {
  const { components, colors } = useTheme();
  const { background, text } = TONES[tone];

  return (
    <View
      style={[components.badge, { alignSelf: 'flex-start', backgroundColor: colors[background] }]}>
      <AppText variant="label" color={text}>
        {label}
      </AppText>
    </View>
  );
}
