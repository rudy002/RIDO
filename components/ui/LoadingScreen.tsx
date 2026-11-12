import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

type LoadingScreenProps = {
  /** Lu par les lecteurs d'écran (« Chargement… »). */
  label: string;
};

/** Écran d'attente, le temps que les données arrivent du serveur. */
export function LoadingScreen({ label }: LoadingScreenProps) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
      }}>
      <ActivityIndicator size="large" color={colors.textMuted} />
    </View>
  );
}
