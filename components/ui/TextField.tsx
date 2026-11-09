import { useState, type Ref } from 'react';
import {
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
  type TextInputInstance,
} from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';
import { FieldLabel } from './FieldLabel';

type TextFieldProps = Pick<
  TextInputProps,
  | 'value'
  | 'onChangeText'
  | 'placeholder'
  | 'keyboardType'
  | 'maxLength'
  | 'autoComplete'
  | 'textContentType'
  | 'autoCapitalize'
  | 'autoCorrect'
  | 'returnKeyType'
  | 'onSubmitEditing'
  | 'submitBehavior'
  | 'autoFocus'
  | 'onFocus'
  | 'onBlur'
  | 'testID'
> & {
  label: string;
  /** Libellé lu par les lecteurs d'écran mais non affiché (champ de recherche). */
  labelHidden?: boolean;
  /** Aide affichée sous le champ. */
  hint?: string;
  ref?: Ref<TextInputInstance>;
  style?: StyleProp<ViewStyle>;
};

/** Champ de saisie avec son libellé et une aide optionnelle. */
export function TextField({
  label,
  labelHidden = false,
  hint,
  ref,
  style,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) {
  const { components, colors, spacing, isRTL } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={style}>
      {labelHidden ? null : <FieldLabel>{label}</FieldLabel>}
      <TextInput
        {...inputProps}
        ref={ref}
        accessibilityLabel={label}
        accessibilityHint={hint}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.text}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          components.input.container,
          components.input.text,
          // Un TextInput ne suit pas le sens de son parent : alignement explicite selon la langue.
          { textAlign: isRTL ? 'right' : 'left' },
          focused && { borderColor: colors.inverse },
        ]}
      />
      {hint ? (
        <AppText color="textMuted" style={{ marginTop: spacing.sm }}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
