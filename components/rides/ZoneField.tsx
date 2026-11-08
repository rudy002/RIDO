import { MapPin } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TextInputProps } from 'react-native';

import { AutocompleteField } from '@/components/ui/AutocompleteField';
import { useTheme } from '@/lib/design/use-theme';
import type { CountryCode } from '@/lib/phone/phone';
import { hasPlaces, searchPlaces } from '@/lib/places/places';
import type { Zone } from '@/lib/rides/types';

/** Texte saisi et zone retenue (null tant qu'aucun choix n'est fait). */
export type ZoneInput = { text: string; zone: Zone | null };

type ZoneFieldProps = Pick<
  TextInputProps,
  'returnKeyType' | 'onSubmitEditing' | 'submitBehavior'
> & {
  country: CountryCode;
  /** Par défaut « D'où pars-tu ? ». */
  label?: string;
  hint?: string;
  value: ZoneInput;
  onChange: (value: ZoneInput) => void;
};

/** « D'où pars-tu ? » : villes et quartiers du pays de l'événement, ou saisie libre. */
export function ZoneField({
  country,
  label,
  hint,
  value,
  onChange,
  ...inputProps
}: ZoneFieldProps) {
  const { t } = useTranslation();
  const { language } = useTheme();
  const searchable = hasPlaces(country);

  const options = useMemo(
    () =>
      searchable
        ? searchPlaces(country, value.text, language).map(({ id, name, city }) => ({
            id,
            title: name,
            subtitle: city,
          }))
        : [],
    [searchable, country, value.text, language]
  );

  const changeText = (text: string) =>
    // Sans base de lieux pour ce pays, la saisie libre suffit.
    onChange({ text, zone: searchable ? null : { placeId: null, name: text } });

  return (
    <AutocompleteField
      {...inputProps}
      label={label ?? t('join.zone.label')}
      placeholder={t('join.zone.placeholder')}
      hint={hint}
      value={value.text}
      onChangeText={changeText}
      options={options}
      optionIcon={MapPin}
      committed={!searchable || value.zone !== null}
      onSelect={({ id, title, subtitle }) => {
        const name = subtitle ? `${title}, ${subtitle}` : title;
        onChange({ text: name, zone: { placeId: id, name } });
      }}
      freeTextLabel={t('join.zone.other', { value: value.text.trim() })}
      onSelectFreeText={() =>
        onChange({ text: value.text, zone: { placeId: null, name: value.text.trim() } })
      }
    />
  );
}
