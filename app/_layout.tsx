import '@/lib/i18n';

import { PortalHost } from '@rn-primitives/portal';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { FONT_ASSETS } from '@/lib/design/fonts';
import { navigationTheme } from '@/lib/design/navigation-theme';
import { useTheme } from '@/lib/design/use-theme';
import { applyDirection } from '@/lib/i18n/rtl';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);
  const { scheme, language, colors, typography } = useTheme();

  useEffect(() => {
    applyDirection(language);
  }, [language]);

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

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
          }}
        />
        <PortalHost />
      </ThemeProvider>
    </KeyboardProvider>
  );
}
