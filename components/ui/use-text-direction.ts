import { Children, type ReactNode } from 'react';
import { Platform, type TextStyle } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

/** Marque invisible « de droite à gauche » (RLM). */
const RLM = '‏';
const RTL_STYLE: TextStyle = { writingDirection: 'rtl' };

/**
 * Sens des paragraphes en hébreu. Sans cela, un texte qui commence par un mot latin
 * (« Gan Yavne, 5 ק״מ ממך ») est lu de gauche à droite et ses mots se mélangent.
 * iOS suit le style `writingDirection` ; Android, la première lettre forte du texte : on y place
 * une marque RLM. Sur le web, `dir="rtl"` sur la page s'en charge déjà.
 */
export function useTextDirection(): {
  style: TextStyle | undefined;
  mark: (children: ReactNode) => ReactNode;
} {
  const { isRTL } = useTheme();
  const needsMark = isRTL && Platform.OS === 'android';

  return {
    style: isRTL ? RTL_STYLE : undefined,
    mark: (children) => {
      if (!needsMark) return children;
      const items = Children.toArray(children);
      const [first] = items;
      if (typeof first === 'string' && first.startsWith(RLM)) return children;
      return [RLM, ...items];
    },
  };
}
