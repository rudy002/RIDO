import { FlatList, View } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';
import { formatTime } from '@/lib/i18n/format';

import { OptionRow } from './OptionRow';
import { PickerSheet } from './PickerSheet';

type TimePickerProps = {
  visible: boolean;
  title: string;
  slots: Date[];
  selected: Date;
  onSelect: (time: Date) => void;
  onClose: () => void;
};

/** Liste d'heures (créneaux de 15 min), ouverte sur l'heure choisie. */
export function TimePicker({
  visible,
  title,
  slots,
  selected,
  onSelect,
  onClose,
}: TimePickerProps) {
  const { spacing, sizes, language } = useTheme();
  const rowHeight = sizes.input;
  const selectedIndex = Math.max(
    0,
    slots.findIndex((slot) => slot.getTime() === selected.getTime())
  );

  return (
    <PickerSheet visible={visible} title={title} onClose={onClose}>
      <FlatList
        data={slots}
        keyExtractor={(slot) => String(slot.getTime())}
        style={{ marginTop: spacing.lg }}
        // Ouvre la liste avec l'heure choisie en vue, deux lignes sous le haut.
        initialScrollIndex={Math.max(0, selectedIndex - 2)}
        getItemLayout={(_, index) => ({ length: rowHeight, offset: rowHeight * index, index })}
        renderItem={({ item }) => (
          <OptionRow
            label={formatTime(item, language)}
            selected={item.getTime() === selected.getTime()}
            onPress={() => {
              onSelect(item);
              onClose();
            }}
          />
        )}
        ListFooterComponent={<View style={{ height: spacing.xxl }} />}
      />
    </PickerSheet>
  );
}
