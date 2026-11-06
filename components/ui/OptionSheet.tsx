import { Info } from 'lucide-react-native';
import { View } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { InfoNote } from './InfoNote';
import { OptionRow } from './OptionRow';
import { PickerSheet } from './PickerSheet';

export type SheetOption<T extends string> = { value: T; label: string };

type OptionSheetProps<T extends string> = {
  visible: boolean;
  title: string;
  options: SheetOption<T>[];
  value: T;
  onSelect: (value: T) => void;
  onClose: () => void;
  /** Message sous la liste (ex. : redémarrage nécessaire). */
  note?: string;
};

/** Fenêtre de choix parmi quelques options (apparence, langue). */
export function OptionSheet<T extends string>({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
  note,
}: OptionSheetProps<T>) {
  const { spacing } = useTheme();

  return (
    <PickerSheet visible={visible} title={title} onClose={onClose}>
      <View style={{ marginTop: spacing.lg }}>
        {options.map((option) => (
          <OptionRow
            key={option.value}
            label={option.label}
            selected={option.value === value}
            onPress={() => onSelect(option.value)}
          />
        ))}
      </View>
      {note ? (
        <View style={{ padding: spacing.screen }} accessibilityLiveRegion="polite">
          <InfoNote icon={Info} text={note} />
        </View>
      ) : null}
    </PickerSheet>
  );
}
