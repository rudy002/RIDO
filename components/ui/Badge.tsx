import { View, type StyleProp, type ViewStyle } from 'react-native';

import type { Colors } from '@/lib/design/tokens';
import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';

export type BadgeTone = 'primary' | 'inverse' | 'accent' | 'success' | 'danger';

const TONES: Record<BadgeTone, { background: keyof Colors; text: keyof Colors }> = {
  primary: { background: 'primary', text: 'onPrimary' },
  inverse: { background: 'inverse', text: 'onInverse' },
  accent: { background: 'accentSoft', text: 'onAccentSoft' },
  success: { background: 'seatFree', text: 'seatFreeText' },
  danger: { background: 'dangerSoft', text: 'dangerText' },
};

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  /** Coupe le texte avec « … » au-delà d'une ligne (pastille dans une rangée étroite). */
  singleLine?: boolean;
  /** Petite pastille (rôle, statut) dans une carte. */
  small?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Pastille (type d'événement, statut). */
export function Badge({
  label,
  tone = 'primary',
  singleLine = false,
  small = false,
  style,
}: BadgeProps) {
  const { components, colors } = useTheme();
  const { background, text } = TONES[tone];

  return (
    <View
      style={[
        small ? components.badgeSmall : components.badge,
        { alignSelf: 'flex-start', backgroundColor: colors[background] },
        style,
      ]}>
      <AppText
        variant={small ? 'tag' : 'label'}
        color={text}
        numberOfLines={singleLine ? 1 : undefined}>
        {label}
      </AppText>
    </View>
  );
}
