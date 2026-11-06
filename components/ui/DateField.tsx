import { useState } from 'react';
import { Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';
import { formatShortDay } from '@/lib/i18n/format';

import { CalendarPicker } from './CalendarPicker';

type DateFieldProps = {
  value: Date | null;
  onChange: (day: Date) => void;
  /** Lu par le lecteur d'écran et titre du calendrier. */
  label: string;
  placeholder: string;
  minDate: Date;
  style?: StyleProp<ViewStyle>;
};

const PRESSED_OPACITY = 0.85;

/** Champ de date : affiche le jour choisi (« Sam. 14/06 »), ouvre un calendrier. */
export function DateField({ value, onChange, label, placeholder, minDate, style }: DateFieldProps) {
  const { components, colors, language } = useTheme();
  const [open, setOpen] = useState(false);
  const text = value ? formatShortDay(value, language) : placeholder;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${text}`}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          components.input.container,
          { justifyContent: 'center' },
          pressed && { opacity: PRESSED_OPACITY },
          style,
        ]}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[components.input.text, !value && { color: colors.textMuted }]}>
          {text}
        </Text>
      </Pressable>
      <CalendarPicker
        visible={open}
        title={label}
        selected={value}
        minDate={minDate}
        onSelect={onChange}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
