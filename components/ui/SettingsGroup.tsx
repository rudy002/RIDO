import { Children, Fragment, type ReactNode } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';

type SettingsGroupProps = {
  title: string;
  children: ReactNode;
};

/** Section de réglages : titre en petites capitales, lignes séparées par un trait. */
export function SettingsGroup({ title, children }: SettingsGroupProps) {
  const { colors, spacing, sizes, radius } = useTheme();
  const rows = Children.toArray(children);

  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="overline" color="textMuted" accessibilityRole="header">
        {title}
      </AppText>
      <View
        style={{ borderRadius: radius.xl, backgroundColor: colors.surface, overflow: 'hidden' }}>
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 ? (
              <View style={{ height: sizes.borderHairline, backgroundColor: colors.divider }} />
            ) : null}
            {row}
          </Fragment>
        ))}
      </View>
    </View>
  );
}
