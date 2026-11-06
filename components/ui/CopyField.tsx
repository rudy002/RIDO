import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';

type CopyFieldProps = {
  /** Texte affiché (ex. : le lien sans « https:// »). */
  label: string;
  /** Texte copié. */
  value: string;
  /** Lu par le lecteur d'écran avant le texte (« Lien de l'événement »). */
  accessibilityLabel: string;
};

const PRESSED_OPACITY = 0.85;
const COPIED_FEEDBACK_MS = 2000;

/** Texte à copier (lien de partage) dans un cadre en pointillés, avec un bouton « Copier ». */
export function CopyField({ label, value, accessibilityLabel }: CopyFieldProps) {
  const { t } = useTranslation();
  const { components, typography, colors } = useTheme();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const copy = async () => {
    await Clipboard.setStringAsync(value);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  };

  return (
    <View style={components.copyField.container}>
      <AppText
        variant="bodyStrong"
        numberOfLines={1}
        ellipsizeMode="middle"
        accessibilityLabel={`${accessibilityLabel}, ${label}`}
        style={{ flex: 1 }}>
        {label}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copied ? t('common.copied') : t('common.copy')}
        accessibilityLiveRegion="polite"
        onPress={() => void copy()}
        style={({ pressed }) => [
          components.copyField.button,
          pressed && { opacity: PRESSED_OPACITY },
        ]}>
        <Text style={[typography.label, { color: colors.text }]}>
          {copied ? t('common.copied') : t('common.copy')}
        </Text>
      </Pressable>
    </View>
  );
}
