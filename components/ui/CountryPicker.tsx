import { Check } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, View } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';
import { listCountries, searchCountries, type Country, type CountryCode } from '@/lib/phone/phone';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { PickerSheet } from './PickerSheet';
import { TextField } from './TextField';

type CountryPickerProps = {
  visible: boolean;
  selected: CountryCode;
  onSelect: (code: CountryCode) => void;
  onClose: () => void;
};

const PRESSED_OPACITY = 0.85;

/** Liste plein écran des pays avec recherche, pour choisir un indicatif. */
export function CountryPicker({ visible, selected, onSelect, onClose }: CountryPickerProps) {
  const { t } = useTranslation();
  const { colors, spacing, sizes, language } = useTheme();
  const [query, setQuery] = useState('');

  const countries = useMemo(() => listCountries(language), [language]);
  const results = useMemo(() => searchCountries(countries, query), [countries, query]);

  const close = () => {
    setQuery('');
    onClose();
  };

  const renderItem = ({ item }: { item: Country }) => {
    const isSelected = item.code === selected;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.name} ${item.callingCode}`}
        accessibilityState={{ selected: isSelected }}
        onPress={() => {
          onSelect(item.code);
          close();
        }}
        style={({ pressed }) => [
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            minHeight: sizes.input,
            paddingHorizontal: spacing.screen,
          },
          pressed && { opacity: PRESSED_OPACITY },
        ]}>
        <AppText variant="heading">{item.flag}</AppText>
        <AppText variant={isSelected ? 'bodyStrong' : 'body'} style={{ flex: 1 }}>
          {item.name}
        </AppText>
        <AppText variant="label" color="textMuted">
          {item.callingCode}
        </AppText>
        {isSelected ? <Icon as={Check} /> : null}
      </Pressable>
    );
  };

  return (
    <PickerSheet visible={visible} title={t('phone.picker.title')} onClose={close}>
      <TextField
        label={t('phone.picker.search')}
        labelHidden
        placeholder={t('phone.picker.search')}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        style={{ paddingHorizontal: spacing.screen, paddingVertical: spacing.lg }}
      />

      <FlatList
        data={results}
        keyExtractor={(country) => country.code}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={20}
        ItemSeparatorComponent={() => (
          <View
            style={{
              height: sizes.borderHairline,
              backgroundColor: colors.divider,
              marginHorizontal: spacing.screen,
            }}
          />
        )}
        ListEmptyComponent={
          <AppText color="textMuted" style={{ paddingHorizontal: spacing.screen }}>
            {t('phone.picker.empty')}
          </AppText>
        }
      />
    </PickerSheet>
  );
}
