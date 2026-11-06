import { Check } from 'lucide-react-native';
import { FlatList, Pressable, View } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';
import { formatTime } from '@/lib/i18n/format';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { PickerSheet } from './PickerSheet';

type TimePickerProps = {
  visible: boolean;
  title: string;
  slots: Date[];
  selected: Date;
  onSelect: (time: Date) => void;
  onClose: () => void;
};

const PRESSED_OPACITY = 0.85;

/** Liste d'heures (créneaux de 15 min), ouverte sur l'heure choisie. */
export function TimePicker({
  visible,
  title,
  slots,
  selected,
  onSelect,
  onClose,
}: TimePickerProps) {
  const { colors, spacing, sizes, language } = useTheme();
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
        renderItem={({ item }) => {
          const isSelected = item.getTime() === selected.getTime();
          const label = formatTime(item, language);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: isSelected }}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
              style={({ pressed }) => [
                {
                  height: rowHeight,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: spacing.screen,
                  borderBottomWidth: sizes.borderHairline,
                  borderBottomColor: colors.divider,
                },
                pressed && { opacity: PRESSED_OPACITY },
              ]}>
              <AppText variant={isSelected ? 'bodyStrong' : 'body'} style={{ flex: 1 }}>
                {label}
              </AppText>
              {isSelected ? <Icon as={Check} /> : null}
            </Pressable>
          );
        }}
        ListFooterComponent={<View style={{ height: spacing.xxl }} />}
      />
    </PickerSheet>
  );
}
