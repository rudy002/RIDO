import { DarkTheme, DefaultTheme, type Theme } from 'expo-router/react-navigation';

import { palette, type ColorScheme } from './tokens';

/** Couleurs de la navigation (en-têtes, fonds d'écran) tirées des tokens. */
export function navigationTheme(scheme: ColorScheme): Theme {
  const c = palette[scheme];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      background: c.background,
      card: c.background,
      text: c.text,
      border: c.divider,
      primary: c.text,
      notification: c.danger,
    },
  };
}
