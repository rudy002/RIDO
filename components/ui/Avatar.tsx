import { View } from 'react-native';

import { useTheme } from '@/lib/design/use-theme';

import { AppText } from './AppText';

type AvatarProps = {
  name: string;
  /** Ton éteint (ex. : conducteur complet). */
  muted?: boolean;
  /** Liste (48), en-tête d'une fiche (76), profil (80). */
  size?: 'medium' | 'large' | 'profile';
};

const SIZE_TOKEN = { medium: 'avatar', large: 'avatarLarge', profile: 'avatarProfile' } as const;

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
export function Avatar({ name, muted = false, size: variant = 'medium' }: AvatarProps) {
  const { colors, sizes, radius } = useTheme();
  const size = sizes[SIZE_TOKEN[variant]];

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
      <AppText
        variant={variant === 'medium' ? 'label' : 'title'}
        color={muted ? 'textMuted' : 'onAccentSoft'}>
        {initialsOf(name)}
      </AppText>
    </View>
  );
}
