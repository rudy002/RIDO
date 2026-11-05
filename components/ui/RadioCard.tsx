import { Check, type LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import type { Colors } from '@/lib/design/tokens';
import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

export type RadioCardTone = 'success' | 'accent';

const TONES: Record<RadioCardTone, { background: keyof Colors; icon: keyof Colors }> = {
  success: { background: 'seatFree', icon: 'seatFreeText' },
  accent: { background: 'accentSoft', icon: 'onAccentSoft' },
};

type RadioCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  tone?: RadioCardTone;
  selected: boolean;
  onSelect: () => void;
};

const PRESSED_OPACITY = 0.85;

/** Carte de choix exclusif (un seul choix possible dans le groupe), à placer dans un radiogroup. */
export function RadioCard({
  title,
  description,
  icon,
  tone = 'success',
  selected,
  onSelect,
}: RadioCardProps) {
  const { components, colors, sizes } = useTheme();
  const styles = components.radioCard;
  const { background, icon: iconColor } = TONES[tone];

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={title}
      accessibilityHint={description}
      accessibilityState={{ checked: selected }}
      onPress={onSelect}
      style={({ pressed }) => [
        styles.container,
        selected && styles.containerSelected,
        pressed && { opacity: PRESSED_OPACITY },
      ]}>
      <View style={[styles.iconTile, { backgroundColor: colors[background] }]}>
        <Icon as={icon} color={iconColor} size={sizes.iconTileGlyph} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="heading">{title}</AppText>
        <AppText color="textMuted">{description}</AppText>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <Icon as={Check} color="onInverse" size={sizes.radioGlyph} /> : null}
      </View>
    </Pressable>
  );
}
