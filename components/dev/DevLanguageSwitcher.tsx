import { Languages } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DevSettings, I18nManager, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/lib/design/use-theme';
import { detectLanguage, isRTLLanguage, LANGUAGES, type Language } from '@/lib/i18n';
import { saveLanguageOverride } from '@/lib/i18n/language-override';
import { applyDirection } from '@/lib/i18n/rtl';

/** `null` : langue du téléphone. */
type Choice = Language | null;

const CHOICES: Choice[] = [...LANGUAGES, null];

/**
 * Outil de développement (jamais affiché dans l'appli publiée) : change la langue d'un geste.
 * Passer de/vers l'hébreu redémarre l'appli, seul moyen d'appliquer le sens RTL.
 */
export function DevLanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const { colors, typography, spacing, sizes, radius, language } = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const choose = async (choice: Choice) => {
    setOpen(false);
    const target = choice ?? detectLanguage();
    await saveLanguageOverride(choice);
    const needsReload = Platform.OS !== 'web' && isRTLLanguage(target) !== I18nManager.isRTL;
    await i18n.changeLanguage(target);
    applyDirection(target);
    if (needsReload) DevSettings.reload();
  };

  const item = (key: string, label: string, onPress: () => void, active = false) => (
    <Pressable
      key={key}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        minWidth: sizes.touchMin,
        height: sizes.touchMin,
        paddingHorizontal: spacing.sm,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? colors.onInverse : undefined,
      }}>
      <Text style={[typography.label, { color: active ? colors.inverse : colors.onInverse }]}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View
      accessibilityLabel={t('dev.language.label')}
      style={{
        position: 'absolute',
        end: 0,
        bottom: insets.bottom + sizes.buttonPrimary * 2,
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.xs,
        borderTopStartRadius: radius.pill,
        borderBottomStartRadius: radius.pill,
        backgroundColor: colors.inverse,
      }}>
      {open ? (
        CHOICES.map((choice) =>
          item(
            choice ?? 'system',
            choice ? choice.toUpperCase() : t('dev.language.system'),
            () => void choose(choice),
            choice === language
          )
        )
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('dev.language.label')}
          onPress={() => setOpen(true)}
          style={{
            height: sizes.touchMin,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            paddingHorizontal: spacing.sm,
          }}>
          <Icon as={Languages} color="onInverse" />
          <Text style={[typography.label, { color: colors.onInverse }]}>
            {language.toUpperCase()}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
