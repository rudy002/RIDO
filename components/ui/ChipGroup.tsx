import { View } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { Chip } from './Chip';
import { FieldLabel } from './FieldLabel';

export type ChipOption<T extends string> = { value: T; label: string };

type ChipGroupProps<T extends string> = {
  label: string;
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** Choix unique parmi des pastilles qui passent à la ligne. */
export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: ChipGroupProps<T>) {
  const { spacing } = useTheme();

  return (
    <View>
      <FieldLabel>{label}</FieldLabel>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={option.value === value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
    </View>
  );
}
