import { useMemo, useRef, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/design/use-theme';

import { ScreenScrollContext, type ScreenScroll } from './use-screen-scroll';

type ScreenProps = {
  children: ReactNode;
  /** Zone collée en bas de l'écran (bouton principal, mention). */
  footer?: ReactNode;
  /** Trait de séparation au-dessus du pied (quand la liste défile dessous). */
  footerDivider?: boolean;
  /** Écran au-dessus d'une barre d'onglets : c'est elle qui gère la zone sûre du bas. */
  aboveTabBar?: boolean;
};

/** Cadre commun des écrans : fond, zones sûres, marges, pied fixe qui remonte avec le clavier. */
export function Screen({
  children,
  footer,
  footerDivider = false,
  aboveTabBar = false,
}: ScreenProps) {
  const { colors, spacing, sizes } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);

  const scroll = useMemo<ScreenScroll>(
    () => ({
      scrollToTop: (element) => {
        const content = contentRef.current;
        if (!element || !content) return;
        element.measureLayout(content, (_x, y) =>
          scrollRef.current?.scrollTo({ y: Math.max(0, y - spacing.lg), animated: true })
        );
      },
    }),
    [spacing.lg]
  );

  return (
    <SafeAreaView
      edges={aboveTabBar ? ['top'] : ['top', 'bottom']}
      style={{ flex: 1, backgroundColor: colors.background }}>
      {/* react-native-keyboard-controller : fiable en plein écran Android, contrairement à celui de RN. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled">
          <View
            ref={contentRef}
            style={{
              paddingHorizontal: spacing.screen,
              paddingTop: spacing.lg,
              paddingBottom: spacing.xxl,
              gap: spacing.xl,
            }}>
            <ScreenScrollContext value={scroll}>{children}</ScreenScrollContext>
          </View>
        </ScrollView>
        {footer ? (
          <View
            style={{
              paddingHorizontal: spacing.screen,
              paddingTop: spacing.md,
              paddingBottom: spacing.sm,
              gap: spacing.md,
              ...(footerDivider && {
                borderTopWidth: sizes.borderHairline,
                borderTopColor: colors.divider,
              }),
            }}>
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
