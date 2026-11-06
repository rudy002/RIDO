import { View } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';

export type RouteStop = { title: string; subtitle?: string };

type RouteTimelineProps = {
  from: RouteStop;
  to: RouteStop;
};

/** Trajet en deux étapes : point de départ, trait, carré d'arrivée. */
export function RouteTimeline({ from, to }: RouteTimelineProps) {
  const { components, spacing, typography } = useTheme();
  const { start, line, end, markerColumn } = components.timeline;
  // Centre le repère sur la première ligne du titre.
  const markerOffset = (typography.bodyStrong.lineHeight - start.height) / 2;

  const stop = ({ title, subtitle }: RouteStop) => (
    <View style={{ flex: 1 }}>
      <AppText variant="bodyStrong">{title}</AppText>
      {subtitle ? <AppText color="textMuted">{subtitle}</AppText> : null}
    </View>
  );

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ flexDirection: 'row', gap: spacing.lg }}>
        <View style={{ width: markerColumn, alignItems: 'center', paddingTop: markerOffset }}>
          <View style={start} />
          {/* Le trait descend jusqu'au repère d'arrivée, à travers l'espace entre les étapes. */}
          <View style={[line, { flex: 1, marginBottom: -spacing.lg }]} />
        </View>
        {stop(from)}
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.lg }}>
        <View style={{ width: markerColumn, alignItems: 'center', paddingTop: markerOffset / 2 }}>
          <View style={end} />
        </View>
        {stop(to)}
      </View>
    </View>
  );
}
