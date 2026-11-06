import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useTheme } from '@/lib/design/use-theme';

type ZoneBarProps = {
  name: string;
  /** État écrit en toutes lettres (« 0 place · 3 demandes ») : la couleur ne suffit pas. */
  text: string;
  /** Part des demandes couvertes par des places, de 0 à 1. */
  ratio: number;
  tone: 'ok' | 'alert';
};

/** Une zone de départ : places proposées face aux demandes. */
export function ZoneBar({ name, text, ratio, tone }: ZoneBarProps) {
  const { spacing } = useTheme();

  return (
    <View accessible accessibilityLabel={`${name}, ${text}`} style={{ gap: spacing.sm }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: spacing.md,
        }}>
        <AppText variant="label" style={{ flexShrink: 1 }}>
          {name}
        </AppText>
        <AppText variant="label" color={tone === 'ok' ? 'seatFreeText' : 'dangerText'}>
          {text}
        </AppText>
      </View>
      <ProgressBar ratio={ratio} color={tone === 'ok' ? 'seatFreeStroke' : 'danger'} />
    </View>
  );
}
