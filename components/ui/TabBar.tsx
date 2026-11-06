import type { LucideIcon } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/design/use-theme';

import { Icon } from './Icon';

export type TabItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  selected: boolean;
  onPress: () => void;
};

type TabBarProps = {
  items: TabItem[];
};

const PRESSED_OPACITY = 0.85;
const ACTIVE_STROKE = 2.5;
const INACTIVE_STROKE = 2;

/** Barre d'onglets du bas : onglets égaux, trait en haut de l'onglet actif. */
export function TabBar({ items }: TabBarProps) {
  const { components, sizes, spacing } = useTheme();
  const { container, indicator, label, labelActive } = components.tabBar;
  const insets = useSafeAreaInsets();
  // La marge du bas couvre au moins la zone sûre (barre de gestes, encoche).
  const bottom = Math.max(container.paddingBottom, insets.bottom);

  return (
    <View
      accessibilityRole="tablist"
      style={[
        container,
        { height: container.height - container.paddingBottom + bottom, paddingBottom: bottom },
      ]}>
      {items.map((item) => (
        <Pressable
          key={item.key}
          accessibilityRole="tab"
          accessibilityLabel={item.label}
          accessibilityState={{ selected: item.selected }}
          onPress={item.onPress}
          style={({ pressed }) => [
            { flex: 1, alignItems: 'center', minHeight: sizes.touchMin },
            pressed && { opacity: PRESSED_OPACITY },
          ]}>
          <View
            style={[
              { alignSelf: 'stretch', marginHorizontal: spacing.sm },
              indicator,
              !item.selected && { backgroundColor: 'transparent' },
            ]}
          />
          <View
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs }}>
            <Icon
              as={item.icon}
              size={sizes.tabIcon}
              color={item.selected ? 'text' : 'textMuted'}
              strokeWidth={item.selected ? ACTIVE_STROKE : INACTIVE_STROKE}
            />
            <Text numberOfLines={1} style={[label, item.selected && labelActive]}>
              {item.label}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
