import { createContext, useContext } from 'react';
import type { View } from 'react-native';

export type ScreenScroll = {
  /** Fait défiler l'écran pour amener cet élément en haut (ex. : champ dont les suggestions s'ouvrent). */
  scrollToTop: (element: View | null) => void;
};

export const ScreenScrollContext = createContext<ScreenScroll>({ scrollToTop: () => {} });

/** Défilement de l'écran (`Screen`) qui contient le composant. */
export function useScreenScroll(): ScreenScroll {
  return useContext(ScreenScrollContext);
}
