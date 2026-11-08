import { ChevronDown } from 'lucide-react-native';
import { useState, type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View, type TextInputInstance } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';
import { countryOf, examplePhoneOf, sanitizePhoneInput, type PhoneInput } from '@/lib/phone/phone';

import { CountryPicker } from './CountryPicker';
import { FieldLabel } from './FieldLabel';
import { Icon } from './Icon';
import { TextField } from './TextField';

type PhoneFieldProps = {
  label: string;
  countryLabel: string;
  value: PhoneInput;
  onChange: (value: PhoneInput) => void;
  ref?: Ref<TextInputInstance>;
};

const PRESSED_OPACITY = 0.85;

/** Indicatif du pays (liste avec recherche) et numéro, sur une même ligne. */
export function PhoneField({ label, countryLabel, value, onChange, ref }: PhoneFieldProps) {
  const { t } = useTranslation();
  const { components, spacing, sizes, language } = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);
  const country = countryOf(value.country, language);

  return (
    <View style={{ flexDirection: 'row', gap: spacing.md }}>
      <View style={{ width: sizes.countryField }}>
        <FieldLabel>{countryLabel}</FieldLabel>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('phone.picker.selected', {
            country: country.name,
            code: country.callingCode,
          })}
          onPress={() => setPickerOpen(true)}
          style={({ pressed }) => [
            components.input.container,
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              paddingHorizontal: spacing.md,
            },
            pressed && { opacity: PRESSED_OPACITY },
          ]}>
          <Text style={components.input.text}>{country.flag}</Text>
          <Text style={[components.input.text, { flex: 1 }]} numberOfLines={1}>
            {country.callingCode}
          </Text>
          <Icon as={ChevronDown} color="textMuted" />
        </Pressable>
      </View>

      <TextField
        ref={ref}
        style={{ flex: 1 }}
        label={label}
        placeholder={examplePhoneOf(value.country)}
        value={value.national}
        onChangeText={(text) => onChange(sanitizePhoneInput(text, value))}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
      />

      <CountryPicker
        visible={pickerOpen}
        selected={value.country}
        onSelect={(code) =>
          onChange(sanitizePhoneInput(value.national, { ...value, country: code }))
        }
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}
