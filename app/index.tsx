import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/lib/design/use-theme';

// Écran d'accueil provisoire : sera remplacé par les écrans des maquettes.
export default function HomeScreen() {
  const { t } = useTranslation();
  const { spacing } = useTheme();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          padding: spacing.screen,
          gap: spacing.lg,
        }}>
        <AppText variant="display">{t('home.title')}</AppText>
        <AppText color="textMuted">{t('home.subtitle')}</AppText>
        <Button label={t('home.cta')} />
      </View>
    </>
  );
}
