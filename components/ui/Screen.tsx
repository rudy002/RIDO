import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/design/use-theme';

type ScreenProps = {
  children: ReactNode;
  /** Zone collée en bas de l'écran (bouton principal, mention). */
  footer?: ReactNode;
};

/** Cadre commun des écrans : fond, zones sûres, marges, pied fixe qui remonte avec le clavier. */
export function Screen({ children, footer }: ScreenProps) {
  const { colors, spacing } = useTheme();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
      {/* react-native-keyboard-controller : fiable en plein écran Android, contrairement à celui de RN. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: spacing.screen,
            paddingTop: spacing.lg,
            paddingBottom: spacing.xxl,
            gap: spacing.xl,
          }}>
          {children}
        </ScrollView>
        {footer ? (
          <View
            style={{
              paddingHorizontal: spacing.screen,
              paddingTop: spacing.md,
              paddingBottom: spacing.sm,
              gap: spacing.md,
            }}>
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
