import { View } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';

type AvatarProps = {
  name: string;
  /** Ton éteint (ex. : conducteur complet). */
  muted?: boolean;
  /** Grand format pour l'en-tête d'une fiche. */
  large?: boolean;
};

/** Premières lettres des deux premiers mots : « David Cohen » → « DC ». */
export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toLocaleUpperCase())
    .join('');
}

/** Rond avec les initiales ; décoratif, le nom est toujours écrit à côté. */
export function Avatar({ name, muted = false, large = false }: AvatarProps) {
  const { colors, sizes, radius } = useTheme();
  const size = large ? sizes.avatarLarge : sizes.avatar;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: muted ? colors.segment : colors.accentSoft,
      }}>
      <AppText variant={large ? 'title' : 'label'} color={muted ? 'textMuted' : 'onAccentSoft'}>
        {initialsOf(name)}
      </AppText>
    </View>
  );
}
