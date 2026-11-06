import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

export type SegmentOption<T extends string> = { value: T; label: string };

type SegmentedControlProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

const PRESSED_OPACITY = 0.85;

/** Onglets côte à côte (Aller / Retour…), un seul actif. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const { components } = useTheme();
  const { container, item, itemActive, text, textActive } = components.segmented;

  return (
    <View accessibilityRole="tablist" style={container}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              item,
              selected && itemActive,
              pressed && !selected && { opacity: PRESSED_OPACITY },
            ]}>
            <Text style={[text, selected && textActive]} numberOfLines={1} adjustsFontSizeToFit>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
