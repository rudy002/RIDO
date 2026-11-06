import i18n from '@/lib/i18n';

import { PortalHost } from '@rn-primitives/portal';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { DevLanguageSwitcher } from '@/components/dev/DevLanguageSwitcher';

import { FONT_ASSETS } from '@/lib/design/fonts';
import { loadAppearance } from '@/lib/design/appearance';
import { navigationTheme } from '@/lib/design/navigation-theme';
import { useTheme } from '@/lib/design/use-theme';
import { loadLanguageOverride } from '@/lib/i18n/language-override';
import { directionMismatch, reloadForDirection } from '@/lib/i18n/restart';
import { applyDirection } from '@/lib/i18n/rtl';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);
  const { scheme, language, colors, typography } = useTheme();
  // Langue et apparence choisies dans le profil : appliquées avant d'afficher le premier écran.
  const [preferencesReady, setPreferencesReady] = useState(false);

  useEffect(() => {
    void Promise.all([
      loadLanguageOverride().then(async (override) => {
        if (!override) return;
        await i18n.changeLanguage(override);
        // Au démarrage, le système réapplique son propre sens d'affichage : on le corrige.
        if (directionMismatch(override)) {
          applyDirection(override);
          await reloadForDirection();
        }
      }),
      loadAppearance(),
    ]).finally(() => setPreferencesReady(true));
  }, []);

  useEffect(() => {
    applyDirection(language);
  }, [language]);

  const ready = (fontsLoaded || Boolean(fontError)) && preferencesReady;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    // Expo SDK 56 est en plein écran (edge-to-edge) : le contrôleur de clavier doit le conserver.
    <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
      <ThemeProvider value={navigationTheme(scheme)}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShadowVisible: false,
            headerTitleStyle: { fontFamily: typography.heading.fontFamily },
            contentStyle: { backgroundColor: colors.background },
          }}>
          {/* Les onglets dessinent leur propre haut d'écran. */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <PortalHost />
        {__DEV__ ? <DevLanguageSwitcher /> : null}
      </ThemeProvider>
    </KeyboardProvider>
  );
}
