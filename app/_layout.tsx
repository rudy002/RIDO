import i18n from '@/lib/i18n';

import { PortalHost } from '@rn-primitives/portal';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { DevLanguageSwitcher } from '@/components/dev/DevLanguageSwitcher';

import { ensureSession, isBackendConfigured } from '@/lib/backend/supabase';
import { FONT_ASSETS } from '@/lib/design/fonts';
import { loadAppData } from '@/lib/data/store';
import { loadAppearance } from '@/lib/design/appearance';
import { navigationTheme } from '@/lib/design/navigation-theme';
import { useTheme } from '@/lib/design/use-theme';
import { loadLanguageOverride } from '@/lib/i18n/language-override';
import { applyDocumentDirection } from '@/lib/i18n/rtl';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);
  const { scheme, language, isRTL, colors, typography } = useTheme();
  // Langue, apparence et données enregistrées : chargées avant d'afficher le premier écran.
  const [preferencesReady, setPreferencesReady] = useState(false);

  useEffect(() => {
    void Promise.all([
      loadLanguageOverride().then((override) =>
        override ? i18n.changeLanguage(override) : undefined
      ),
      loadAppearance(),
      loadAppData(),
    ]).finally(() => setPreferencesReady(true));
    // Compte invisible de cet appareil, préparé dès le lancement sans retarder l'affichage.
    // Sans réseau, il sera créé au prochain essai.
    if (isBackendConfigured()) void ensureSession().catch(() => undefined);
  }, []);

  useEffect(() => {
    applyDocumentDirection(language);
  }, [language]);

  const ready = (fontsLoaded || Boolean(fontError)) && preferencesReady;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    // Expo SDK 56 est en plein écran (edge-to-edge) : le contrôleur de clavier doit le conserver.
    <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
      {/*
        Sens de lecture porté par l'interface elle-même : immédiat et sans redémarrage,
        contrairement à I18nManager, qu'Expo Go réinitialise à chaque ouverture.
      */}
      <View style={{ flex: 1, direction: isRTL ? 'rtl' : 'ltr' }}>
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
      </View>
    </KeyboardProvider>
  );
}
