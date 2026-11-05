import { Link, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/lib/design/use-theme';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  const { spacing, sizes } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: t('notFound.title') }} />
      <View style={{ flex: 1, padding: spacing.screen, gap: spacing.lg }}>
        <AppText>{t('notFound.message')}</AppText>
        <Link href="/" style={{ minHeight: sizes.touchMin }}>
          <AppText variant="label">{t('notFound.back')}</AppText>
        </Link>
      </View>
    </>
  );
}
