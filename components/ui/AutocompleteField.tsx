import { PenLine, type LucideIcon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { TextField } from './TextField';
import { useScreenScroll } from './use-screen-scroll';

export type AutocompleteOption = { id: string; title: string; subtitle?: string };

type AutocompleteFieldProps = Pick<
  TextInputProps,
  'placeholder' | 'autoCapitalize' | 'returnKeyType' | 'onSubmitEditing' | 'submitBehavior'
> & {
  label: string;
  /** Aide affichée sous le champ quand aucune suggestion n'est ouverte. */
  hint?: string;
  value: string;
  onChangeText: (text: string) => void;
  options: AutocompleteOption[];
  onSelect: (option: AutocompleteOption) => void;
  /** Icône des suggestions (lieu, personne…). */
  optionIcon: LucideIcon;
  /** Dernière ligne pour garder la saisie telle quelle (« Autre : … »), si autorisé. */
  freeTextLabel?: string;
  onSelectFreeText?: () => void;
  /** Masque les suggestions une fois un choix fait. */
  committed: boolean;
};

const PRESSED_OPACITY = 0.85;

/** Champ de saisie avec suggestions affichées juste en dessous. */
export function AutocompleteField({
  label,
  hint,
  value,
  onChangeText,
  options,
  onSelect,
  optionIcon,
  freeTextLabel,
  onSelectFreeText,
  committed,
  ...inputProps
}: AutocompleteFieldProps) {
  const { colors, components, spacing, sizes, radius } = useTheme();
  const [focused, setFocused] = useState(false);

  const containerRef = useRef<View>(null);
  const { scrollToTop } = useScreenScroll();

  const showFreeText = Boolean(freeTextLabel && onSelectFreeText);
  const open = focused && !committed && value.trim().length > 0;

  // Le clavier laisse peu de place : on remonte le champ pour que les suggestions soient visibles.
  useEffect(() => {
    if (open) scrollToTop(containerRef.current);
  }, [open, scrollToTop]);

  const row = (
    key: string,
    icon: LucideIcon,
    onPress: () => void,
    title: string,
    subtitle?: string
  ) => (
    <Pressable
      key={key}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          minHeight: sizes.input,
          paddingHorizontal: spacing.lg,
        },
        pressed && { opacity: PRESSED_OPACITY },
      ]}>
      <Icon as={icon} color="textMuted" />
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong">{title}</AppText>
        {subtitle ? <AppText color="textMuted">{subtitle}</AppText> : null}
      </View>
    </Pressable>
  );

  return (
    <View ref={containerRef}>
      <TextField
        {...inputProps}
        label={label}
        hint={open ? undefined : hint}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCorrect={false}
      />
      {open && (options.length > 0 || showFreeText) ? (
        <View
          accessibilityRole="list"
          style={{
            marginTop: spacing.sm,
            borderRadius: radius.md,
            borderWidth: sizes.borderStrong,
            borderColor: components.input.container.borderColor,
            backgroundColor: colors.surface,
            overflow: 'hidden',
          }}>
          {options.map((option, index) => (
            <View
              key={option.id}
              style={
                index > 0
                  ? { borderTopWidth: sizes.borderHairline, borderTopColor: colors.divider }
                  : undefined
              }>
              {row(option.id, optionIcon, () => onSelect(option), option.title, option.subtitle)}
            </View>
          ))}
          {showFreeText && freeTextLabel && onSelectFreeText ? (
            <View
              style={
                options.length > 0
                  ? { borderTopWidth: sizes.borderHairline, borderTopColor: colors.divider }
                  : undefined
              }>
              {row('free-text', PenLine, onSelectFreeText, freeTextLabel)}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
