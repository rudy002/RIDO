import { useState } from 'react';
import { Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';
import { formatTime } from '@/lib/i18n/format';

import { TimePicker } from './TimePicker';

type TimeFieldProps = {
  value: Date;
  slots: Date[];
  onChange: (time: Date) => void;
  /** Lu par le lecteur d'écran et titre de la liste (« Au plus tôt »). */
  label: string;
  style?: StyleProp<ViewStyle>;
};

const PRESSED_OPACITY = 0.85;

/** Champ d'heure : affiche l'heure choisie, ouvre la liste des créneaux. */
export function TimeField({ value, slots, onChange, label, style }: TimeFieldProps) {
  const { components, language } = useTheme();
  const [open, setOpen] = useState(false);
  const time = formatTime(value, language);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${time}`}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          components.input.container,
          { alignItems: 'center', justifyContent: 'center' },
          pressed && { opacity: PRESSED_OPACITY },
          style,
        ]}>
        <Text style={components.input.text}>{time}</Text>
      </Pressable>
      <TimePicker
        visible={open}
        title={label}
        slots={slots}
        selected={value}
        onSelect={onChange}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
